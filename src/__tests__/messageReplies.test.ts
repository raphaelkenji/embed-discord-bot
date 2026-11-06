import { syncReply, deleteReply, serializeMessage } from '../services/messageReplies';
import { UrlService, UserService } from '../services';

jest.mock('../services', () => ({ UrlService: jest.fn(), UserService: jest.fn() }));

const urls = { getCachedReply: jest.fn(), getPlatforms: jest.fn(), replacementLinks: jest.fn(), cacheReply: jest.fn(), removeCachedReply: jest.fn() };
const users = { findById: jest.fn() };
const reply = { id: 'reply', edit: jest.fn(), delete: jest.fn() };
const message = { id: 'original', guildId: 'guild', channelId: 'channel', partial: false, author: { id: 'user', bot: false }, content: 'link', channel: { messages: { fetch: jest.fn() } }, reply: jest.fn(), inGuild: () => false };

beforeEach(() => {
  jest.resetAllMocks();
  (UrlService as jest.Mock).mockImplementation(() => urls);
  (UserService as jest.Mock).mockImplementation(() => users);
  users.findById.mockResolvedValue({ activated: true });
  urls.getPlatforms.mockResolvedValue([]);
  urls.replacementLinks.mockReturnValue('https://replacement.example/a');
  message.reply.mockResolvedValue(reply);
  message.channel.messages.fetch.mockResolvedValue(reply);
  reply.delete.mockResolvedValue(undefined);
});

it('creates and persists a reply when a link is added', async () => {
  await syncReply(message as any);
  expect(message.reply).toHaveBeenCalledWith({ content: 'https://replacement.example/a', allowedMentions: { parse: [], repliedUser: false } });
  expect(urls.cacheReply).toHaveBeenCalledWith('original', 'reply', 'channel');
});

it('updates an existing reply loaded from persistence', async () => {
  urls.getCachedReply.mockResolvedValue('reply');
  await syncReply(message as any);
  expect(reply.edit).toHaveBeenCalledWith(expect.objectContaining({ content: 'https://replacement.example/a' }));
  expect(message.reply).not.toHaveBeenCalled();
});

it('removes the reply when an edit removes the link', async () => {
  urls.getCachedReply.mockResolvedValue('reply');
  urls.replacementLinks.mockReturnValue('');
  await syncReply(message as any);
  expect(reply.delete).toHaveBeenCalled();
  expect(urls.removeCachedReply).toHaveBeenCalledWith('original');
});

it('removes the reply for a user who disabled tracking', async () => {
  urls.getCachedReply.mockResolvedValue('reply');
  users.findById.mockResolvedValue({ activated: false });
  await syncReply(message as any);
  expect(reply.delete).toHaveBeenCalled();
  expect(message.reply).not.toHaveBeenCalled();
});

it('processes messages from other guilds', async () => {
  await syncReply({ ...message, guildId: 'other' } as any);
  expect(message.reply).toHaveBeenCalled();
});

it('ignores direct messages before accessing data', async () => {
  await syncReply({ ...message, guildId: null } as any);
  expect(users.findById).not.toHaveBeenCalled();
});

it('fetches partial messages before processing them', async () => {
  const fetch = jest.fn().mockResolvedValue(message);
  await syncReply({ ...message, partial: true, fetch } as any);
  expect(fetch).toHaveBeenCalled();
  expect(message.reply).toHaveBeenCalled();
});

it('recreates a reply that was deleted independently', async () => {
  urls.getCachedReply.mockResolvedValue('reply');
  message.channel.messages.fetch.mockRejectedValue({ code: 10008 });
  await syncReply(message as any);
  expect(urls.removeCachedReply).toHaveBeenCalledWith('original');
  expect(message.reply).toHaveBeenCalled();
});

it('preserves persistence when Discord rejects deletion', async () => {
  urls.getCachedReply.mockResolvedValue('reply');
  reply.delete.mockRejectedValue(new Error('Missing permissions'));
  await expect(deleteReply(message as any)).rejects.toThrow('Missing permissions');
  expect(urls.removeCachedReply).not.toHaveBeenCalled();
});

it('cleans up a reply when persistence fails', async () => {
  urls.cacheReply.mockRejectedValue(new Error('Database unavailable'));
  await expect(syncReply(message as any)).rejects.toThrow('Database unavailable');
  expect(reply.delete).toHaveBeenCalled();
});

it('serializes creation and deletion for the same message', async () => {
  const actions: string[] = [];
  await Promise.all([
    serializeMessage('id', async () => { await Promise.resolve(); actions.push('created'); }),
    serializeMessage('id', async () => { actions.push('deleted'); }),
  ]);
  expect(actions).toEqual(['created', 'deleted']);
});

it('preserves an existing reply when regex processing times out', async () => {
  urls.replacementLinks.mockRejectedValue(new Error('Regex processing exceeded 500ms'));
  await expect(syncReply(message as any)).rejects.toThrow('Regex processing exceeded 500ms');
  expect(reply.edit).not.toHaveBeenCalled();
  expect(reply.delete).not.toHaveBeenCalled();
  expect(urls.removeCachedReply).not.toHaveBeenCalled();
});
