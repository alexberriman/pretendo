export const handleClear = async (): Promise<void> => {
  // Clear the console
  process.stdout.write("\x1Bc");
};