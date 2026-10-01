export interface ParsedCommand {
  id: string;
  action: string;
  command: string;
  rawTag: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed' | 'failed';
  result?: string;
}

// Regex baraye shenasaee format: [WIN_AGENT:ACTION:دستور]
const COMMAND_REGEX = /\[WIN_AGENT:([A-Z0-9_]+):([\s\S]*?)\]/g;

/**
 * Parser baraye joda kardane faramine [WIN_AGENT:ACTION:PAYLOAD] az matne pasokh
 * va tabdile an be tag-haye tamiz dar UI va trigger kardane modal-e taeed
 */
export function extractAgentCommands(text: string): {
  cleanText: string;
  commands: ParsedCommand[];
} {
  const commands: ParsedCommand[] = [];

  const cleanText = text.replace(COMMAND_REGEX, (match, action, command) => {
    const id = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    commands.push({
      id,
      action: action.trim(),
      command: command.trim(),
      rawTag: match,
      status: 'pending'
    });
    return `\n⚡ [درخواست اجرای دستور سیستمی ویندوز: ${action.trim()}]\n`;
  });

  return { cleanText, commands };
}
