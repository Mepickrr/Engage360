// src/components/flows/builder/nodes/WhatsAppNode/data/mockFlowForms.js
let uid = 0;
function nextId(prefix) {
  uid += 1;
  return `${prefix}_${Date.now()}_${uid}`;
}

export function createBlankScreen(title = "Screen") {
  return { id: nextId("scr"), title, components: [], continueLabel: "Continue" };
}

const COMPONENT_DEFAULTS = {
  large_heading: () => ({ text: "" }),
  small_heading: () => ({ text: "" }),
  caption:       () => ({ text: "" }),
  body:          () => ({ text: "" }),
  image:         () => ({ url: "", height: 400 }),
  short_answer:  () => ({ inputType: "text", label: "", instructions: "", required: true }),
  paragraph:     () => ({ label: "", instructions: "", required: true }),
  date_picker:   () => ({ label: "", instructions: "", required: true }),
  single_choice: () => ({ label: "", options: ["", ""], required: true }),
  multi_choice:  () => ({ label: "", options: [""], required: true }),
  dropdown:      () => ({ label: "", options: [""], required: true }),
  opt_in:        () => ({
    consentLabel: "", readMoreUrl: "", required: true,
    editContent: { title: "", largeHeading: "", smallHeading: "", caption: "", body: "", imageUrl: "" },
  }),
};

export function createComponent(kind) {
  const defaults = COMPONENT_DEFAULTS[kind] ? COMPONENT_DEFAULTS[kind]() : {};
  return { id: nextId("cmp"), kind, ...defaults };
}

function surveyScreen() {
  const screen = createBlankScreen("Your form");
  const question = { ...createComponent("multi_choice"), label: "You've found the perfect deal, what do you do next?", options: [
    "Buy it right away", "Check reviews before buying", "Share it with friends + family", "Buy multiple, while its cheap", "None of the above",
  ] };
  screen.components = [question];
  return screen;
}

function eventScreen() {
  const screen = createBlankScreen("Register");
  screen.components = [
    { ...createComponent("short_answer"), label: "Full name", instructions: "" },
    { ...createComponent("short_answer"), inputType: "email", label: "Email address", instructions: "" },
    { ...createComponent("short_answer"), inputType: "phone", label: "Phone number", instructions: "" },
  ];
  screen.continueLabel = "Register";
  return screen;
}

function signupScreen() {
  const screen = createBlankScreen("Sign up");
  screen.components = [
    { ...createComponent("short_answer"), label: "Full name", instructions: "" },
    { ...createComponent("short_answer"), inputType: "phone", label: "Phone number", instructions: "" },
  ];
  screen.continueLabel = "Sign up";
  return screen;
}

export const FLOW_TYPE_PRESETS = {
  survey: {
    label: "Send a survey",
    desc: "Ask questions and collect preferences to better understand your users.",
    seedScreens: [surveyScreen()],
  },
  event: {
    label: "Register for an event",
    desc: "Collect information from your users to register them for an event or promotion",
    seedScreens: [eventScreen()],
  },
  signup: {
    label: "Complete sign-up",
    desc: "Quickly capture contact information",
    seedScreens: [signupScreen()],
  },
  custom: {
    label: "Custom form",
    desc: "Create a form tailored to your specific needs",
    seedScreens: [createBlankScreen("Your form")],
  },
};

export const MOCK_FLOW_FORMS = [
  { id: "ff_1", name: "Post-purchase survey", flowType: "survey", updatedAt: "2 days ago", screens: [surveyScreen()] },
  { id: "ff_2", name: "Event RSVP", flowType: "event", updatedAt: "1 week ago", screens: [eventScreen()] },
];
