import handler from '../events/guild/interactionCreate';

jest.mock('../config/environment', () => ({ environment: { BOT_OWNER_ID: 'owner' } }));
jest.mock('../utils', () => ({ logger: { warn: jest.fn(), error: jest.fn() } }));

function interaction(owner: boolean, guildId: string | null = 'guild') {
  const execute = jest.fn();
  return {
    execute,
    isChatInputCommand: () => true,
    guildId,
    user: { id: owner ? 'owner' : 'other' },
    commandName: 'url',
    client: { commands: new Map([['url', { ownerOnly: true, execute }]]) },
    memberPermissions: { has: () => true },
    reply: jest.fn(), deferReply: jest.fn(), editReply: jest.fn(),
    deferred: true,
  };
}

it('rejects other users even when they are guild administrators', async () => {
  const input = interaction(false);
  await handler.execute(input as any);
  expect(input.execute).not.toHaveBeenCalled();
  expect(input.reply).toHaveBeenCalledWith(expect.objectContaining({ ephemeral: true }));
});

it('allows the owner in another guild without administrator permissions', async () => {
  const input = interaction(true, 'other');
  input.memberPermissions.has = () => false;
  await handler.execute(input as any);
  expect(input.execute).toHaveBeenCalledWith(input);
});

it('allows other users to execute public commands', async () => {
  const input = interaction(false);
  input.client.commands.set('url', { ownerOnly: false, execute: input.execute });
  await handler.execute(input as any);
  expect(input.execute).toHaveBeenCalledWith(input);
});

it('ignores commands in direct messages', async () => {
  const input = interaction(true, null);
  await handler.execute(input as any);
  expect(input.execute).not.toHaveBeenCalled();
});

it('acknowledges the interaction before executing an authorized command', async () => {
  const input = interaction(true);
  input.execute.mockImplementation(() => expect(input.deferReply).toHaveBeenCalled());
  await handler.execute(input as any);
  expect(input.execute).toHaveBeenCalledWith(input);
});

it('edits the deferred response when command execution fails', async () => {
  const input = interaction(true);
  input.execute.mockRejectedValue(new Error('Database unavailable'));
  await handler.execute(input as any);
  expect(input.editReply).toHaveBeenCalledWith({ content: 'There was an error while executing this command!' });
});
