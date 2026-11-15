import {
  LayoutDashboard, Image as ImageIcon, HardDrive, BarChart3, DollarSign,
  Megaphone, Users, Inbox, Building2, Share2, ScrollText,
  LineChart, PhoneCall, Presentation, Wallet, Receipt, PieChart, TrendingUp,
  FileText, Briefcase, Workflow, UserCog, History, Activity, Filter,
} from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: any
  /** Short plain-English line shown in the command palette. */
  hint?: string
  /** Extra words that should match in search. */
  keywords?: string
}
export type NavGroup = { label: string; items: NavItem[] }

/** Single source of truth for the admin's navigation (sidebar + Cmd+K). */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, hint: 'Leads, trends and what needs attention', keywords: 'home overview stats' },
      { href: '/admin/analytics/site', label: 'Site Analytics', icon: Activity, hint: 'Users, sessions and channels, measured by the site itself', keywords: 'traffic visitors pageviews sessions ga4 analytics' },
      { href: '/admin/analytics/forms', label: 'Form Funnel', icon: Filter, hint: 'Where people give up on your forms, and conversion rates', keywords: 'funnel friction drop off conversion forms' },
    ],
  },
  {
    label: 'Site Content',
    items: [
      { href: '/admin/announcements', label: 'Announcements & Pop-up', icon: Megaphone, hint: 'Top bar message and promo pop-up, with live preview', keywords: 'banner offer promo bar pill toggle' },
      { href: '/admin/pricing', label: 'Pricing & Packages', icon: DollarSign, hint: 'Package prices shown on the site', keywords: 'price cost plans' },
      { href: '/admin/legal', label: 'Terms & Privacy', icon: ScrollText, hint: 'Edit the legal pages', keywords: 'policy legal tos' },
      { href: '/admin/media', label: 'Manage Media', icon: ImageIcon, hint: 'Swap the photos and videos used on each page', keywords: 'images photos video slots hero' },
      { href: '/admin/storage', label: 'Storage', icon: HardDrive, hint: 'Space used, uploads, and every file', keywords: 'upload files assets space usage' },
    ],
  },
  {
    label: 'Leads & Pitches',
    items: [
      { href: '/admin/leads/dashboard', label: 'Leads Dashboard', icon: BarChart3, hint: 'Where leads come from and how they convert' },
      { href: '/admin/leads', label: 'Leads', icon: Inbox, hint: 'Every enquiry from the website', keywords: 'inbox enquiries contacts' },
      { href: '/admin/leads/pipeline', label: 'Pipeline', icon: Workflow, hint: 'Leads by stage, drag to move', keywords: 'kanban stages' },
      { href: '/admin/leads/marketing', label: 'Lead Marketing', icon: Megaphone, hint: 'Campaign and channel attribution', keywords: 'utm campaign' },
      { href: '/admin/leads/offline', label: 'Offline Leads', icon: PhoneCall, hint: 'Add a lead from a call, referral or event', keywords: 'manual phone referral add lead' },
      { href: '/admin/leads/pitches', label: 'Pitches', icon: Presentation, hint: 'Proposals and pitches in flight', keywords: 'proposal deck' },
      { href: '/admin/analytics', label: 'Tracking & SEO', icon: LineChart, hint: 'Tracking scripts and tag managers', keywords: 'gtm ga4 scripts tags' },
    ],
  },
  {
    label: 'Billing & Revenue',
    items: [
      { href: '/admin/finance/revenue', label: 'Revenue Dashboard', icon: TrendingUp, hint: 'Income over time, by client and project', keywords: 'money income report' },
      { href: '/admin/finance/invoices', label: 'Invoices & Receipts', icon: FileText, hint: 'Create and track invoices', keywords: 'bill receipt' },
      { href: '/admin/finance/clients', label: 'Clients & Projects', icon: Briefcase, hint: 'Who you work with and what you are building' },
      { href: '/admin/finance/dashboard', label: 'Expenses Dashboard', icon: PieChart, hint: 'Spend by category and month' },
      { href: '/admin/finance/expenses', label: 'Expenses', icon: Receipt, hint: 'Log and review costs', keywords: 'spend costs' },
      { href: '/admin/finance/accounts', label: 'Billing Accounts', icon: Wallet, hint: 'Bank and payment accounts', keywords: 'bank payment' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/admin/company', label: 'Company Profile', icon: Building2, hint: 'Name, address, contact details, logos' },
      { href: '/admin/socials', label: 'Social Links', icon: Share2, hint: 'Which platforms show on the site', keywords: 'instagram linkedin' },
      { href: '/admin/users', label: 'Access Management', icon: Users, hint: 'Who can sign in and what they can do', keywords: 'team roles permissions invite' },
      { href: '/admin/users/activity', label: 'Sign-in Activity', icon: History, hint: 'Who signed in and out, and when (admins only)', keywords: 'login history audit security' },
      { href: '/admin/account', label: 'My Account', icon: UserCog, hint: 'Your name and password', keywords: 'profile password' },
    ],
  },
]

const isLeads = (h: string) => h.startsWith('/admin/leads')
const isFinance = (h: string) => h.startsWith('/admin/finance')

/** The groups a given role is allowed to see. Mirrors RoleGate / layout rules. */
export function visibleGroups(role: string): NavGroup[] {
  return NAV_GROUPS.map((g) => {
    let items = g.items
    if (role === 'admin') {
      // everything
    } else if (role === 'manager') {
      items = items.filter((i) => i.href === '/admin' || i.href === '/admin/account' || i.href.startsWith('/admin/analytics/') || isLeads(i.href) || isFinance(i.href))
    } else if (role === 'leads_view' || role === 'leads_edit') {
      items = items.filter((i) => i.href === '/admin' || i.href === '/admin/account' || i.href.startsWith('/admin/analytics/') || isLeads(i.href))
    } else {
      items = items.filter((i) => !i.href.startsWith('/admin/users') && !isFinance(i.href))
    }
    return { ...g, items }
  }).filter((g) => g.items.length > 0)
}

/** Fast actions surfaced in the command palette and on the dashboard. */
export const QUICK_ACTIONS: NavItem[] = [
  { href: '/admin/announcements', label: 'Change the top bar message', icon: Megaphone, hint: 'Site Content', keywords: 'announcement offer toggle on off' },
  { href: '/admin/announcements#promo', label: 'Turn the promo pop-up on or off', icon: Megaphone, hint: 'Site Content', keywords: 'banner popup offer' },
  { href: '/admin/leads/offline', label: 'Add a lead from a call', icon: PhoneCall, hint: 'Leads & Pitches', keywords: 'new lead manual' },
  { href: '/admin/finance/invoices', label: 'Create an invoice', icon: FileText, hint: 'Billing & Revenue', keywords: 'new invoice bill' },
  { href: '/admin/finance/expenses', label: 'Log an expense', icon: Receipt, hint: 'Billing & Revenue', keywords: 'new expense cost' },
  { href: '/admin/legal', label: 'Update the privacy policy', icon: ScrollText, hint: 'Site Content', keywords: 'privacy terms' },
  { href: '/admin/pricing', label: 'Change a price', icon: DollarSign, hint: 'Site Content', keywords: 'pricing package' },
]
