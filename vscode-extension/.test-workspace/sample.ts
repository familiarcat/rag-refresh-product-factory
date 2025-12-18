// Test file for Alex AI Extension
// Select this code and use Cmd+Shift+Q to ask the crew

interface User {
  id: string;
  name: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

// Try: Select the function above and:
// 1. Cmd+Shift+A - Open Alex AI Chat
// 2. Cmd+Shift+Q - Ask Crew About Selection
// 3. Right-click > Alex AI: Explain Code
// 4. Right-click > Alex AI: Review Code (Worf)
