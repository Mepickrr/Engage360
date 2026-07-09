// Dummy directory for the node "Test" modal prototype — no real user data.
export const MOCK_TEST_USERS = [
  { id: "u1", name: "Priya Sharma", email: "priya.sharma@company.com", phone: "+91 98765 43210" },
  { id: "u2", name: "Rahul Verma", email: "rahul.verma@company.com", phone: "+91 91234 56780" },
  { id: "u3", name: "Ananya Iyer", email: "ananya.iyer@company.com", phone: "+91 99887 66554" },
  { id: "u4", name: "Karan Mehta", email: "karan.mehta@company.com", phone: "+91 90909 12345" },
  { id: "u5", name: "Sara Khan", email: "sara.khan@company.com", phone: "+91 98123 45670" },
  { id: "u6", name: "Vikram Nair", email: "vikram.nair@company.com", phone: "+91 97654 32109" },
];

// Which identifier the manual-entry field should collect, per communication channel.
export const CHANNEL_INPUT = {
  whatsapp: { type: "tel", placeholder: "+91 98765 43210", label: "Phone number" },
  sms: { type: "tel", placeholder: "+91 98765 43210", label: "Phone number" },
  rcs: { type: "tel", placeholder: "+91 98765 43210", label: "Phone number" },
  push: { type: "tel", placeholder: "+91 98765 43210", label: "Phone number" },
  email: { type: "email", placeholder: "name@example.com", label: "Email address" },
  onsite: { type: "text", placeholder: "User ID", label: "User ID" },
  inapp: { type: "text", placeholder: "User ID", label: "User ID" },
};
