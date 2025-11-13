/**
 * Calculates status text for a client based on their details
 * @param {Object} client - The client object containing status and other details
 * @param {Object} options - Optional parameters
 * @param {number} options.docCount - Document count info { approved, pending }
 * @param {number} options.totalNeeded - Total documents needed (default: 10)
 * @param {boolean} options.isShortForm - If true, returns shorter status labels (default: false)
 * @returns {string} The calculated status text
 */
export const getClientStatusText = (client, options = {}) => {
  const { docCount = null, totalNeeded = 10, isShortForm = false } = options;

  // 1. Handle FullyApproved status with amount (first check)
  if (client?.clientStatus === "FullyApproved") {
    const amount = parseFloat(client?.fullyApprovedDetails?.amount);
    return `Fully Approved - $${amount.toFixed(0)}`;
  }

  // 2. Handle FullyApproved with paperWorkRequested
  if (
    client?.clientStatus === "FullyApproved" &&
    client?.fullyApprovedDetails?.paperWorkRequested
  ) {
    return "Share Documents";
  }

  // 3. Handle Completed status
  if (client?.clientStatus === "Completed") {
    return "Completed";
  }

  // 4. Handle PreApproved status
  if (client?.clientStatus === "PreApproved") {
    return "Pre Approved";
  }

  // 5. Handle PENDING status
  if (client.status === "PENDING") {
    return isShortForm ? "Client Invited" : "Invited";
  }

  // 6. Handle Account Deleted (first check)
  if (client?.clientAddress === null) {
    return "Account Deleted";
  }

  // 7. Handle ACCEPTED status with no documents
  if (
    client.status === "ACCEPTED" &&
    (!client.documents ||
      client.documents.length === 0 ||
      client?.clientAddress !== null)
  ) {
    return "Signed Up";
  }

  // 8. Handle ACCEPTED status with documents
  if (client.status === "ACCEPTED" && client.documents.length > 0) {
    if (docCount && docCount.approved !== undefined) {
      return `${docCount.approved}/${totalNeeded} Documents`;
    }
    return "Documents";
  }

  // 9. Handle Account Deleted (final check)
  if (client?.clientAddress === null) {
    return "Account Deleted";
  }

  // 10. Fallback to status value
  return client.status || "Unknown";
};
