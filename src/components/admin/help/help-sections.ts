export type HelpSectionAccess =
  | { kind: "always" }
  | { kind: "permission"; section: string; action: string }
  | { kind: "super_admin" };

export type HelpKeyTaskGroup = {
  title?: string;
  steps: string[];
};

export type HelpStatusRow = { term: string; desc: string };

export type HelpSectionDefinition = {
  id: string;
  navLabel: string;
  icon: string;
  access: HelpSectionAccess;
  title: string;
  intro?: string;
  whatYouCanDo?: string[];
  orderStatuses?: HelpStatusRow[];
  offerStatuses?: HelpStatusRow[];
  leadStatuses?: HelpStatusRow[];
  syncStatuses?: string[];
  keyTasks: HelpKeyTaskGroup[];
  tips: string[];
  permissionsNote: string;
};

export const HELP_SECTIONS: HelpSectionDefinition[] = [
  {
    id: "help-dashboard",
    navLabel: "Dashboard",
    icon: "📊",
    access: { kind: "always" },
    title: "Dashboard",
    intro:
      "The dashboard gives you a real-time overview of the business — orders, revenue, B2B offers, and system health.",
    whatYouCanDo: [
      "View today's orders and revenue",
      "See pending B2B offers",
      "Monitor recent activity",
      "Check ERP sync status",
    ],
    keyTasks: [
      {
        steps: [
          "The KPI cards at the top show today's performance. Click any card to go to the full section.",
          "The activity feed shows the latest actions across the platform.",
          "The notification bell (top right) shows alerts that need your attention.",
        ],
      },
    ],
    tips: [
      "The dashboard refreshes automatically. If numbers look stale, hard refresh with Ctrl+Shift+R.",
    ],
    permissionsNote: "All authenticated staff can open the dashboard.",
  },
  {
    id: "help-products",
    navLabel: "Products",
    icon: "🎨",
    access: { kind: "permission", section: "products", action: "view" },
    title: "Products",
    intro:
      "Manage the Chromax-MCR product catalogue — add new products, update details, manage stock visibility, and control which products appear on the website.",
    whatYouCanDo: [
      "View all products (products.view)",
      "Add new products (products.create)",
      "Edit product details (products.edit)",
      "Delete products (products.delete)",
      "Update pricing — requires approval (products.approve_pricing)",
    ],
    keyTasks: [
      {
        title: "Adding a product:",
        steps: [
          'Go to Products → click "Add product"',
          "Fill in the product name, category, description, and pricing",
          "Upload a product image",
          "Set the stock visibility and status",
          "Click Save — product goes live if status is set to Live",
        ],
      },
      {
        title: "Updating a price:",
        steps: [
          "Open the product",
          "Change the price field",
          "Click Save",
          "If your role requires approval: the price change goes to pending. An approver will be notified. The price updates on the site only after approval.",
        ],
      },
      {
        title: "Marking a product as featured:",
        steps: [
          "Open the product",
          'Toggle "Featured on homepage" on',
          "Save — product appears in the Featured Products section on the homepage",
        ],
      },
    ],
    tips: ["Products only appear on the public site when status is set to Live and the category is active."],
    permissionsNote: "Requires products.view (or stronger actions in the same section). Pricing approvals need products.approve_pricing when workflows apply.",
  },
  {
    id: "help-swatches",
    navLabel: "Colour Swatches",
    icon: "🎨",
    access: { kind: "permission", section: "swatches", action: "view" },
    title: "Colour Swatches",
    intro: "Manage the colour swatches available in the Colour Lab and on product pages.",
    whatYouCanDo: [
      "View all swatches",
      "Add new colours",
      "Edit colour names and hex values",
      "Organise by category",
    ],
    keyTasks: [
      {
        title: "Adding a swatch:",
        steps: [
          "Go to Colour Swatches",
          'Click "Add swatch"',
          "Enter the colour name and hex code (e.g. #1A2E5A)",
          "Assign to a category",
          "Save — swatch appears in Colour Lab",
        ],
      },
    ],
    tips: ["Use the colour picker tool at colorhex.com to find exact hex codes for your paint colours."],
    permissionsNote: "Requires swatches.view. Editing needs swatches.edit.",
  },
  {
    id: "help-orders",
    navLabel: "Orders",
    icon: "📦",
    access: { kind: "permission", section: "orders", action: "view" },
    title: "Orders",
    intro:
      "Manage all customer orders — track fulfilment, update status, handle cancellations, and sync with the ERP.",
    whatYouCanDo: [
      "View all orders (orders.view)",
      "Advance order status (orders.fulfil)",
      "Request cancellation (orders.cancel_request)",
      "Approve cancellations (orders.cancel_approve)",
    ],
    orderStatuses: [
      { term: "New", desc: "order placed, payment confirmed" },
      { term: "Confirmed", desc: "order acknowledged by team" },
      { term: "Packed", desc: "items picked and packed" },
      { term: "Dispatched", desc: "shipped, tracking added" },
      { term: "Delivered", desc: "confirmed delivered" },
      { term: "Cancelled", desc: "order cancelled" },
    ],
    keyTasks: [
      {
        title: "Fulfilling an order:",
        steps: [
          "Open the order",
          'Click "Advance status" to move through the fulfilment stages',
          "When dispatching: enter the tracking number and courier name (required before dispatching)",
          "Customer receives an email at Confirmed, Dispatched, and Delivered",
        ],
      },
      {
        title: "Cancelling an order:",
        steps: [
          "Open the order",
          'Click "Request cancellation"',
          "Enter a reason",
          "If you have cancel_approve permission: it cancels immediately",
          "If not: it goes to a super admin for approval — they will be notified",
        ],
      },
    ],
    tips: [
      "Always add a tracking number before marking an order as Dispatched. The customer receives this in their dispatch email.",
    ],
    permissionsNote: "Requires orders.view. Fulfilment and cancellation actions need the matching orders.* permissions.",
  },
  {
    id: "help-b2b",
    navLabel: "B2B Offers",
    icon: "🤝",
    access: { kind: "permission", section: "b2b", action: "view" },
    title: "B2B Offers",
    intro:
      "Manage bulk purchase negotiations with business buyers. Review offers, counter, accept, or decline — all with a full negotiation thread.",
    whatYouCanDo: [
      "View all B2B offers (b2b.view)",
      "Respond to offers (b2b.respond)",
      "Approve counters (b2b.approve)",
    ],
    offerStatuses: [
      { term: "Pending", desc: "new offer, awaiting review" },
      { term: "Reviewing", desc: "team is considering it" },
      { term: "Countered", desc: "team sent a counter offer" },
      { term: "Accepted", desc: "offer accepted, awaiting payment" },
      { term: "Declined", desc: "offer declined" },
      { term: "Converted", desc: "converted to a confirmed order" },
      { term: "Expired", desc: "offer expired without resolution" },
    ],
    keyTasks: [
      {
        title: "Responding to an offer:",
        steps: [
          "Open the B2B offer",
          "Review the buyer's offered price vs the list price and floor price",
          "Choose: Accept / Counter / Decline",
          "If countering: enter your counter price and an optional message",
          "The buyer receives an email immediately with your response",
        ],
      },
      {
        title: "The floor price:",
        steps: [
          "The internal minimum price is shown only to users with b2b.respond permission.",
          "It is never visible to the buyer.",
          "Use it as your guide when negotiating.",
        ],
      },
    ],
    tips: ["Offers older than 12 hours show an urgency indicator. Respond promptly to keep buyers engaged."],
    permissionsNote: "Requires b2b.view. Negotiation and counters need b2b.respond; some counters require b2b.approve via workflows.",
  },
  {
    id: "help-content",
    navLabel: "Content",
    icon: "📝",
    access: { kind: "permission", section: "content", action: "view" },
    title: "Content",
    intro: "Edit the text content of the public website — homepage, about page, and contact page — without any coding.",
    whatYouCanDo: ["View content pages (content.view)", "Edit and publish content (content.edit)"],
    keyTasks: [
      {
        title: "Editing the homepage:",
        steps: [
          "Go to Content → Homepage",
          "The editor is organised into sections: Hero, Trust bar, Categories, About, Colour Lab, Projects, Certifications, Testimonials, Final CTA",
          "Expand any section to edit its text",
          "Change the status to Live to publish",
          "Click Save",
          "Changes appear on the website immediately (or after approval if a workflow is configured)",
        ],
      },
      {
        title: "Important:",
        steps: [
          "Content changes only affect TEXT — not the design or layout.",
          "Images and design are managed by your developer.",
        ],
      },
    ],
    tips: [
      "Always set status to Live before saving if you want changes to appear on the public site. Draft content is saved but not shown to visitors.",
    ],
    permissionsNote: "Requires content.view. Publishing edits needs content.edit (and approver sign-off when configured).",
  },
  {
    id: "help-blog",
    navLabel: "Blog & Guides",
    icon: "✍️",
    access: { kind: "permission", section: "blog", action: "view" },
    title: "Blog & Guides",
    intro:
      "Publish articles, technical guides, and industry news to the Chromax-MCR website. Helps with SEO and customer education.",
    whatYouCanDo: [
      "View all posts (blog.view)",
      "Create posts (blog.create)",
      "Edit posts (blog.edit)",
      "Delete posts (blog.delete)",
    ],
    keyTasks: [
      {
        title: "Post types:",
        steps: [
          "Blog — general news, company updates, industry articles",
          "Guide — technical documentation, product usage guides, how-tos",
        ],
      },
      {
        title: "Publishing a post:",
        steps: [
          'Go to Blog → click "Add post"',
          "Write a title — the slug generates automatically (you can edit it)",
          "Select type: Blog or Guide",
          "Write the content in the body field",
          "Add an excerpt (shown in listings)",
          "Set Published date and status to Live",
          "Save — post appears on /blog",
        ],
      },
    ],
    tips: [
      "Guides are great for product technical data sheets and application instructions. They appear separately from blog posts on the website.",
    ],
    permissionsNote: "Requires blog.view. Creating or editing posts needs blog.create / blog.edit.",
  },
  {
    id: "help-projects",
    navLabel: "Projects",
    icon: "🏗️",
    access: { kind: "permission", section: "projects", action: "view" },
    title: "Projects",
    intro:
      "Showcase completed projects and case studies on the website. Builds credibility with potential buyers.",
    whatYouCanDo: ["View projects (projects.view)", "Create and edit showcase entries (projects.edit)"],
    keyTasks: [
      {
        title: "Adding a project:",
        steps: [
          'Go to Projects → "Add project"',
          "Enter title, sector, location, client name (optional)",
          "Write a short description and full case study body",
          'Toggle "Is case study" if this is a detailed writeup',
          "Set status to Live",
          "Save — project appears on /projects",
        ],
      },
    ],
    tips: ["Add at least 3 live projects so the Projects section on the homepage shows real data."],
    permissionsNote: "Requires projects.view. Editing needs projects.edit.",
  },
  {
    id: "help-certifications",
    navLabel: "Certifications",
    icon: "🏆",
    access: { kind: "permission", section: "certifications", action: "view" },
    title: "Certifications",
    intro:
      "Manage ISO certificates, export licences, safety data sheets, and awards displayed on the website.",
    whatYouCanDo: ["View certifications (certifications.view)", "Create and edit records (certifications.edit)"],
    keyTasks: [
      {
        title: "Adding a certification:",
        steps: [
          'Go to Certifications → "Add certification"',
          "Enter the name, issuing body, and dates",
          "Select the type: ISO, Export Licence, MSDS, Award, or Other",
          "Upload the document URL if available",
          "Toggle Active on",
          "Save — appears on /certifications",
        ],
      },
    ],
    tips: [
      "Certifications with an expiry date within 90 days show an amber warning badge. Renew them before they expire to maintain the green 'valid' badge on the website.",
    ],
    permissionsNote: "Requires certifications.view. Editing needs certifications.edit.",
  },
  {
    id: "help-erp",
    navLabel: "ERP Sync",
    icon: "🔄",
    access: { kind: "permission", section: "erp_sync", action: "view" },
    title: "ERP Sync",
    intro: "Monitor the connection between the Chromax dashboard and the ERP system. All sync events are logged here.",
    whatYouCanDo: [
      "View sync status and connection health",
      "See all sync events and their status",
      "Retry failed sync events",
      "Filter by direction and status",
    ],
    syncStatuses: [
      "Success → synced correctly",
      "Failed → sync attempt failed",
      "Retrying → being retried automatically",
      "Dead letter → failed after 5 attempts, needs manual intervention",
    ],
    keyTasks: [
      {
        title: "Retrying a failed event:",
        steps: [
          "Find the failed event in the log",
          'Click "Retry"',
          "The event is re-queued and will attempt again within 30 seconds",
        ],
      },
      {
        title: "Dead letter events:",
        steps: [
          "If an event shows Dead letter, it has failed 5 times and will not retry automatically.",
          "Contact your developer to investigate the cause.",
        ],
      },
    ],
    tips: ["If the connection shows Degraded, check that the ERP server is running and the Front Sync module is active."],
    permissionsNote: "Requires erp_sync.view.",
  },
  {
    id: "help-ai-logs",
    navLabel: "AI Chat Logs",
    icon: "🤖",
    access: { kind: "permission", section: "ai_leads", action: "view" },
    title: "AI Chat Logs",
    intro: "View conversations and leads captured by the AI chat widget on the website.",
    whatYouCanDo: ["View all captured leads", "Update lead status", "Convert a lead to a B2B offer"],
    leadStatuses: [
      { term: "New", desc: "just captured, not yet contacted" },
      { term: "Contacted", desc: "team has reached out" },
      { term: "Converted", desc: "became a B2B offer or order" },
      { term: "Lost", desc: "did not convert" },
    ],
    keyTasks: [
      {
        title: "Converting a lead to B2B:",
        steps: [
          "Open the lead",
          "Review the conversation and product interest",
          'Click "Convert to B2B offer"',
          "A B2B offer is created pre-filled with the lead's details",
          "The lead status becomes Converted",
        ],
      },
    ],
    tips: ["Check AI leads daily — they are often warm prospects who have already described their project needs."],
    permissionsNote: "Requires ai_leads.view.",
  },
  {
    id: "help-audit",
    navLabel: "Audit Log",
    icon: "📋",
    access: { kind: "permission", section: "audit_log", action: "view" },
    title: "Audit Log",
    intro: "A complete tamper-proof record of every action taken in the dashboard — who did what and when.",
    whatYouCanDo: [
      "Search by user or action type",
      "Filter by section, source, or date",
      "Expand any row to see before/after values",
      "Export filtered results as CSV",
    ],
    keyTasks: [],
    tips: [
      "Use the audit log to investigate unexpected changes. Every status update, approval, and content edit is recorded with the exact before and after values.",
    ],
    permissionsNote: "Requires audit_log.view.",
  },
  {
    id: "help-users",
    navLabel: "Users & Staff",
    icon: "👥",
    access: { kind: "super_admin" },
    title: "Users & Staff",
    intro: "Manage staff accounts, customer accounts, and access permissions across the platform.",
    keyTasks: [
      {
        title: "Staff tab — Invite staff:",
        steps: [
          'Click "Invite user"',
          "Enter their email and select a role",
          'Click "Send invite"',
          "They receive a branded invitation email",
          "They click the link, set a password, and sign in",
        ],
      },
      {
        title: "Revoking an invite:",
        steps: [
          "If someone should no longer be invited:",
          "Find them in Pending invitations",
          'Click "Revoke" — the link becomes invalid',
          "Re-invite if needed",
        ],
      },
      {
        title: "Suspending a staff member:",
        steps: [
          "Find the user in the staff list",
          'Click "Suspend"',
          "Enter a reason (optional)",
          "They are immediately blocked from signing in",
          'Click "Unsuspend" to restore access',
        ],
      },
      {
        title: "Customers tab:",
        steps: [
          "View all registered customers with their order count and account status.",
          "Actions available: View their order history; Verify their email manually; Force a password reset; Suspend / unsuspend their account; Add an internal note (not visible to the customer); Delete their account (GDPR).",
        ],
      },
    ],
    tips: [
      "Suspended users see an error when they try to sign in. They are not told why — contact them separately to explain.",
    ],
    permissionsNote: "Super Admin only — full user and customer management.",
  },
  {
    id: "help-roles",
    navLabel: "Roles & Permissions",
    icon: "🔐",
    access: { kind: "super_admin" },
    title: "Roles & Permissions",
    intro: "Define what each staff role can and cannot do in the dashboard.",
    keyTasks: [
      {
        title: "Built-in roles (cannot be deleted):",
        steps: [
          "Super Admin — full access to everything",
          "Admin — broad access, no user management (check your actual seeded roles)",
        ],
      },
      {
        title: "Creating a custom role:",
        steps: [
          "Go to Users → Roles tab",
          'Click "Create role"',
          'Name the role (e.g. "Sales Manager")',
          "Tick the permissions this role needs",
          'Use "Select all" per section for full section access',
          "Save — role is available to assign when inviting staff",
        ],
      },
      {
        title: "Permission sections explained:",
        steps: [
          "products — manage the product catalogue",
          "orders — view and fulfil orders",
          "b2b — handle bulk offer negotiations",
          "content — edit website text",
          "blog — publish articles and guides",
          "projects — manage project showcase",
          "certifications — manage certificates",
          "swatches — manage colour swatches",
          "users — view staff list",
          "workflows — configure approval rules",
          "audit_log — view activity history",
          "erp_sync — monitor ERP connection",
          "ai_leads — view AI chat leads",
        ],
      },
    ],
    tips: ["Always use the principle of least privilege — give roles only the permissions they actually need."],
    permissionsNote: "Super Admin only.",
  },
  {
    id: "help-workflows",
    navLabel: "Approval Workflows",
    icon: "⚙️",
    access: { kind: "super_admin" },
    title: "Approval Workflows",
    intro:
      "Configure which actions require a second person to approve before taking effect. Protects against accidental or unauthorised changes.",
    keyTasks: [
      {
        title: "Available workflow triggers:",
        steps: [
          "Product pricing change",
          "Content / page change",
          "Order cancellation",
          "B2B counter-offer",
          "Colour swatch update",
          "New product created",
          "Product status change",
        ],
      },
      {
        title: "Setting up a workflow:",
        steps: [
          "Go to Workflows",
          "Find the action type to protect",
          'Click "Configure"',
          'Toggle "Approval required" on',
          "Select the approver role (users with this role will be notified)",
          "Choose notification channels: In-app and/or Email",
          'Toggle "Draft until approved" if the change should be hidden until approved',
          "Save",
        ],
      },
      {
        title: "Approving a pending change:",
        steps: [
          "Go to Workflows → Pending approvals",
          "Review the before and after values",
          'Click "Approve" or "Reject"',
          "The submitter is notified by email",
          "Approved changes take effect immediately",
        ],
      },
    ],
    tips: [
      "If no approver role is assigned, super admins receive a fallback alert. Always assign an approver role to avoid confusion.",
    ],
    permissionsNote: "Super Admin only — workflow configuration.",
  },
  {
    id: "help-settings",
    navLabel: "Settings",
    icon: "⚙️",
    access: { kind: "super_admin" },
    title: "Settings",
    intro: "Platform-wide configuration for payments, email, and general settings.",
    keyTasks: [
      {
        title: "Payment settings:",
        steps: [
          "Enable or disable Paystack (NGN) and Stripe (USD/GBP). Add your public API keys.",
          "Secret keys are managed by your developer in the server environment.",
        ],
      },
      {
        title: "Email settings:",
        steps: [
          "Configure SMTP to send emails from your own domain. Works with any email provider — Gmail, Outlook, Zoho, Resend, SendGrid, etc.",
          "Setting up email: Enter SMTP host, port, username, password; Enter your From name and address; Click \"Test email\" to verify; Toggle Email enabled on; Save.",
          "Toggle which events send emails: order confirmations, status updates, B2B responses, approvals, etc.",
        ],
      },
      {
        title: "General settings:",
        steps: ["Set the site name, contact email, and default currency (NGN/USD/GBP)."],
      },
    ],
    tips: [
      "For Gmail/Google Workspace use an App Password, not your main Google password. Generate one at myaccount.google.com → Security → App passwords.",
    ],
    permissionsNote: "Super Admin only.",
  },
];

export function sectionSearchBlob(s: HelpSectionDefinition): string {
  const parts: string[] = [
    s.navLabel,
    s.title,
    s.intro ?? "",
    s.permissionsNote,
    ...(s.whatYouCanDo ?? []),
    ...(s.tips ?? []),
    ...(s.syncStatuses ?? []),
    ...s.keyTasks.flatMap((g) => [g.title ?? "", ...g.steps]),
    ...(s.orderStatuses ?? []).flatMap((r) => [r.term, r.desc]),
    ...(s.offerStatuses ?? []).flatMap((r) => [r.term, r.desc]),
    ...(s.leadStatuses ?? []).flatMap((r) => [r.term, r.desc]),
  ];
  return parts.join(" ").toLowerCase();
}
