export function formatDate(date) {
    // Array of month names
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  
    // Get day, month, and year
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
  
    // Return formatted date
    return `${day} ${month} ${year}`;
  }