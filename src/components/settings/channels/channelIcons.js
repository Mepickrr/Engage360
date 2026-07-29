// src/components/settings/channels/channelIcons.js
import { ShoppingBag, Mail, Globe, MessageCircle, Facebook, Instagram, Radio, MessageCircleHeart } from "lucide-react";

export const CHANNEL_TYPES = {
  shopify:        { label: "Shopify",         Icon: ShoppingBag,        color: "#96BF48" },
  email:          { label: "Email",           Icon: Mail,               color: "#3B82F6" },
  webpush:        { label: "Web push",        Icon: Globe,              color: "#6366F1" },
  whatsapp:       { label: "WhatsApp",        Icon: MessageCircle,      color: "#25D366" },
  facebook:       { label: "Facebook",        Icon: Facebook,           color: "#1877F2" },
  instagram:      { label: "Instagram",       Icon: Instagram,          color: "#E1306C" },
  emails:         { label: "Emails",          Icon: Mail,               color: "#3B82F6" },
  emailmarketing: { label: "Email marketing", Icon: Mail,               color: "#F59E0B" },
  livechat:       { label: "Live Chat",       Icon: MessageCircleHeart, color: "#8B5CF6" },
  rcs:            { label: "RCS",             Icon: Radio,              color: "#EF4444" },
};
