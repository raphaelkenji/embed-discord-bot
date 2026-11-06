import { Message, PartialMessage } from 'discord.js';
import { UrlService, UserService } from './index';
import { logger } from '../utils';

const pending = new Map<string, Promise<void>>();

export function serializeMessage(id: string, action: () => Promise<void>): Promise<void> {
  const next = (pending.get(id) ?? Promise.resolve()).then(action).catch(error => {
    logger.error(`Failed to process message ${id}:`, error);
  });
  pending.set(id, next);
  void next.then(() => { if (pending.get(id) === next) pending.delete(id); });
  return next;
}

function missingMessage(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 10008;
}

export async function syncReply(input: Message | PartialMessage): Promise<void> {
  if (!input.guildId) return;
  const message = input.partial ? await input.fetch() : input;
  if (message.author.bot) return;
  const urls = new UrlService();
  const user = await new UserService().findById(message.author.id);
  const content = user.activated ? await urls.replacementLinks(message.content, await urls.getPlatforms()) : '';
  const replyId = await urls.getCachedReply(message.id);
  let reply: Message | undefined;
  if (replyId) {
    try {
      reply = await message.channel.messages.fetch(replyId);
    } catch (error) {
      if (!missingMessage(error)) throw error;
      await urls.removeCachedReply(message.id);
    }
  }
  if (!content) {
    if (reply) {
      try { await reply.delete(); } catch (error) { if (!missingMessage(error)) throw error; }
      await urls.removeCachedReply(message.id);
    }
    return;
  }
  const payload = { content, allowedMentions: { parse: [] as [], repliedUser: false } };
  if (reply) {
    await reply.edit(payload);
  } else {
    const created = await message.reply(payload);
    try {
      await urls.cacheReply(message.id, created.id, message.channelId);
    } catch (error) {
      await created.delete().catch(cleanupError => logger.error('Failed to clean up untracked reply:', cleanupError));
      throw error;
    }
  }
  if (message.inGuild() && message.guild.members.me && 'permissionsFor' in message.channel &&
      message.channel.permissionsFor(message.guild.members.me)?.has('ManageMessages')) {
    await message.suppressEmbeds(true).catch(error => logger.warn('Failed to suppress original embed:', error));
  }
}

export async function deleteReply(message: Message | PartialMessage): Promise<void> {
  if (!message.guildId) return;
  const urls = new UrlService();
  const replyId = await urls.getCachedReply(message.id);
  if (!replyId) return;
  try {
    const reply = await message.channel.messages.fetch(replyId);
    await reply.delete();
  } catch (error) {
    if (!missingMessage(error)) throw error;
  }
  await urls.removeCachedReply(message.id);
}
