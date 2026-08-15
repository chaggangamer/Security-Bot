import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('security')
    .setDescription('Inspect the current Aegis security posture')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((command) => command.setName('status').setDescription('Show security status')),
];

if (process.argv[1]?.endsWith('commands.ts')) {
  console.info(
    JSON.stringify(
      commands.map((command) => command.toJSON()),
      null,
      2,
    ),
  );
}
