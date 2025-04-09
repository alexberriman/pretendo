import { OutputFormatter } from "../ui/formatter.js";

export const handleHelp = async (): Promise<void> => {
  console.log(OutputFormatter.formatHelpMenu());
};