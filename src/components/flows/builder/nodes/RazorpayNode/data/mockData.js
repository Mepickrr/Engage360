export const RAZORPAY_MANDATORY_FIELDS = [
  { key: "amount",       label: "Amount",       type: "Number" },
  { key: "orderAmount",  label: "OrderAmount",  type: "Number" },
  { key: "orderId",      label: "OrderId",      type: "String" },
  { key: "purpose",      label: "Purpose",      type: "String" },
  { key: "customerId",   label: "CustomerId",   type: "Number" },
  { key: "phoneNumber",  label: "PhoneNumber",  type: "String" },
];

export const RAZORPAY_OPTIONAL_FIELDS = [
  { key: "expire_by",           label: "Expire_by",           type: "Number"  },
  { key: "upi_link",            label: "Upi_link",            type: "Boolean" },
  { key: "completeDraftOrder",  label: "CompleteDraftOrder",  type: "Boolean" },
  { key: "oldOrderId",          label: "OldOrderId",          type: "String"  },
  { key: "description",         label: "Description",         type: "String"  },
  { key: "email",               label: "Email",               type: "String"  },
  { key: "firstName",           label: "FirstName",           type: "String"  },
  { key: "lastName",            label: "LastName",            type: "String"  },
  { key: "sendSms",             label: "SendSms",             type: "Boolean" },
  { key: "sendEmail",           label: "SendEmail",           type: "Boolean" },
];

export const RAZORPAY_SAVED_RESPONSES = [
  "orderId", "paymentLink", "paymentAmount", "orderAmount", "paymentLinkId",
];

export const VARIABLE_GROUPS = [
  {
    id: "customer",
    label: "Customer variables",
    variables: [
      { key: "customer.id",         label: "Customer ID",    type: "Number", recommended: true  },
      { key: "customer.phone",      label: "Phone Number",   type: "String", recommended: true  },
      { key: "customer.email",      label: "Email",          type: "String", recommended: true  },
      { key: "customer.name",       label: "Full Name",      type: "String", recommended: true  },
      { key: "customer.first_name", label: "First Name",     type: "String"                     },
      { key: "customer.last_name",  label: "Last Name",      type: "String"                     },
      { key: "customer.city",       label: "City",           type: "String"                     },
      { key: "customer.country",    label: "Country",        type: "String"                     },
    ],
  },
  {
    id: "product",
    label: "Product variables",
    variables: [
      { key: "order.id",      label: "Order ID",     type: "String", recommended: true  },
      { key: "order.amount",  label: "Order Amount", type: "Number", recommended: true  },
      { key: "order.total",   label: "Order Total",  type: "Number", recommended: true  },
      { key: "product.name",  label: "Product Name", type: "String"                     },
      { key: "product.price", label: "Product Price",type: "Number"                     },
      { key: "product.sku",   label: "Product SKU",  type: "String"                     },
      { key: "product.id",    label: "Product ID",   type: "String"                     },
    ],
  },
  {
    id: "cart",
    label: "Abandoned cart variables",
    variables: [
      { key: "cart.id",           label: "Cart ID",        type: "String", recommended: true  },
      { key: "cart.total",        label: "Cart Total",     type: "Number", recommended: true  },
      { key: "cart.items_count",  label: "Items Count",    type: "Number"                     },
      { key: "cart.recovery_url", label: "Recovery URL",   type: "String"                     },
    ],
  },
  {
    id: "product_viewed",
    label: "Product Viewed Event",
    variables: [
      { key: "event.product_id",    label: "Product ID",    type: "String" },
      { key: "event.product_name",  label: "Product Name",  type: "String" },
      { key: "event.product_price", label: "Product Price", type: "Number" },
      { key: "event.category",      label: "Category",      type: "String" },
    ],
  },
  {
    id: "local_responses",
    label: "Local User Responses",
    variables: [
      { key: "response.1", label: "Response 1", type: "String" },
      { key: "response.2", label: "Response 2", type: "String" },
      { key: "response.3", label: "Response 3", type: "String" },
    ],
  },
  {
    id: "store",
    label: "Store variables",
    variables: [
      { key: "store.name",     label: "Store Name", type: "String", recommended: true  },
      { key: "store.currency", label: "Currency",   type: "String"                     },
      { key: "store.domain",   label: "Domain",     type: "String"                     },
      { key: "store.id",       label: "Store ID",   type: "String"                     },
    ],
  },
  {
    id: "helpdesk",
    label: "Helpdesk variables",
    variables: [
      { key: "ticket.id",     label: "Ticket ID",     type: "String" },
      { key: "ticket.status", label: "Ticket Status", type: "String" },
      { key: "ticket.subject",label: "Ticket Subject",type: "String" },
    ],
  },
  {
    id: "global",
    label: "Global Variables",
    variables: [
      { key: "global.date",      label: "Current Date",  type: "String" },
      { key: "global.time",      label: "Current Time",  type: "String" },
      { key: "global.timestamp", label: "Timestamp",     type: "Number" },
    ],
  },
];

export const defaultRazorpayNodeData = {
  label: "Create Payment Link",
  fieldValues: {},
};
