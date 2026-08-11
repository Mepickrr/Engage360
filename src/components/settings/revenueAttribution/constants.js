import { MessageCircle, Mail, MessageSquareText, Radio, Smartphone } from "lucide-react";

export const DEFAULT_CAMPAIGN_VS_JOURNEY_WINNER = "campaigns";

export const DEFAULT_CHANNEL_PRIORITY = [
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { id: "sms", label: "SMS", Icon: MessageSquareText },
  { id: "email", label: "Email", Icon: Mail },
  { id: "rcs", label: "RCS", Icon: Radio },
  { id: "mobilePush", label: "Mobile Push", Icon: Smartphone },
];
