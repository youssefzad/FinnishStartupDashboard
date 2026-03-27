export type Publication = {
  id: string
  title: string
  description: string
  downloadLabel: string
  href: string
}

export const publications: Publication[] = [
  {
    id: 'helsinki-startup-report',
    title: 'Helsinki Startup Report',
    description:
      'A comprehensive analysis of the Helsinki startup ecosystem, covering company dynamics, growth patterns, and the role of startups in the local economy.',
    downloadLabel: 'Download PDF',
    href: 'https://startupyhteiso.com/wp-content/uploads/Helsinki-Startup-Report-Final.pdf'
  }
]
