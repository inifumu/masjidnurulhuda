export const kasSummaryService = {
  async fetchSummary() {
    const response = await fetch("/api/public/kas/summary");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  },
};
