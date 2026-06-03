export const VOICE_PERSONAS = [
  { id:"varsha", name:"Varsha", description:"Cart recovery and re-engagement", gender:"F", speechRate:0.9, speechPitch:1.1, color:"#7C3AED" },
  { id:"ayush", name:"Ayush", description:"Onboarding and user guidance", gender:"M", speechRate:0.95, speechPitch:0.95, color:"#2563EB" },
  { id:"sneha", name:"Sneha", description:"Customer support and issue resolution", gender:"F", speechRate:0.85, speechPitch:1.0, color:"#DB2777" },
  { id:"umesh", name:"Umesh", description:"Internal team coordination", gender:"M", speechRate:1.0, speechPitch:0.9, color:"#059669" },
  { id:"chhama", name:"Chhama", description:"Feedback collection and surveys", gender:"F", speechRate:0.9, speechPitch:1.05, color:"#D97706" },
  { id:"tripti", name:"Tripti", description:"Order updates and delivery notifications", gender:"F", speechRate:0.95, speechPitch:1.0, color:"#0891B2" },
  { id:"aakash", name:"Aakash", description:"Announcements and notifications", gender:"M", speechRate:1.05, speechPitch:0.85, color:"#4F46E5" },
  { id:"srishti", name:"Srishti", description:"Lead qualification and customer queries", gender:"F", speechRate:0.88, speechPitch:1.15, color:"#BE185D" },
];

export const TONES = [
  { id:"casual", label:"Casual" },
  { id:"professional", label:"Professional" },
  { id:"serious", label:"Serious" },
];

export const AI_CALLING_TEMPLATES = [
  {
    id:"opening_greeting",
    name:"Opening Greeting",
    instruction:"Greet the customer warmly by first name. Introduce yourself as an AI assistant from the brand. Ask if they have 2-3 minutes. If busy, offer a callback. Stay polite and brief.",
    script:"Hi {customerName}! I'm an AI assistant calling from {brandName}. We have some exciting offers I'd love to share with you — it'll just take 2-3 minutes. Is now a good time to chat?",
    suggestedOutputs:["Good time to talk","Busy — callback","Not interested"],
  },
  {
    id:"lead_qualification",
    name:"Lead Qualification",
    instruction:"Qualify the prospect by asking about their purchase intent, budget, and timeline. Capture name, contact, product preference. If not interested, record reason. End with a clear outcome.",
    script:"Hi {customerName}, I'm reaching out about {productCategory}. Could I ask a couple of quick questions to understand your needs better? What's your current timeline for making a purchase decision?",
    suggestedOutputs:["Qualified lead","Not qualified","Follow up later","No answer"],
  },
  {
    id:"objection_handling",
    name:"Objection Handling",
    instruction:"Listen actively to the customer's concerns. Acknowledge their objection empathetically. Provide a relevant solution or offer. Do not be pushy — if objection persists, schedule a callback with a specialist.",
    script:"I completely understand your concern about {objection}. Many of our customers felt the same way at first. What actually helped them was {solution}. Would you like me to share more details on how this could work for you?",
    suggestedOutputs:["Objection resolved","Needs specialist","Not interested","Callback scheduled"],
  },
  {
    id:"callback_scheduling",
    name:"Callback Scheduling",
    instruction:"Confirm a specific callback date and time with the customer. Verify their phone number. Send a confirmation. Keep it brief and professional.",
    script:"I'd like to schedule a more detailed call with one of our specialists. What time works best for you — morning or afternoon? We have slots available on {availableDate}.",
    suggestedOutputs:["Callback confirmed","Declined callback","No answer"],
  },
  {
    id:"order_update",
    name:"Order Update",
    instruction:"Inform the customer about their order status. Provide expected delivery date. Offer to resolve any concerns. If there's a delay, apologize and provide updated ETA.",
    script:"Hi {customerName}, this is a quick update about your order #{orderId}. Your package is {orderStatus} and expected to arrive by {deliveryDate}. Is there anything you'd like me to help with?",
    suggestedOutputs:["Acknowledged","Issue raised","No answer"],
  },
  {
    id:"product_offer",
    name:"Product Offer",
    instruction:"Present the product offer clearly and concisely. Highlight the key benefit and urgency. Ask for a buying decision. If hesitant, offer a trial or discount.",
    script:"Hi {customerName}! I'm calling about an exclusive offer on {productName} — {offerDetails}. This offer is valid only until {expiryDate}. Would you like to take advantage of this today?",
    suggestedOutputs:["Interested — purchase","Wants more info","Not interested","Callback"],
  },
];

export const DEFAULT_OUTPUTS = [
  { id:"interested", label:"Interested", isFixed:true },
  { id:"not_interested", label:"Not Interested", isFixed:true },
  { id:"callback", label:"Callback Requested", isFixed:true },
  { id:"no_answer", label:"No Answer", isFixed:true },
];

export const defaultAiCallingNodeData = {
  label: "AI Call",
  mode: "custom",
  templateId: null,
  instruction: "",
  script: "",
  summary: "",
  outputs: [...DEFAULT_OUTPUTS],
  outputMode: "manual",
  wiredPorts: [],
};
