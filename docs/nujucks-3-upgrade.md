# Upgrading to Nujucks 3

1) Macros import statement changes to this format `{% import "./_macros.htm" as m %}`
2) All macro calls have to be prefixed with `m.` – so `{{ m_imgbanner() }}` becomes `{{ m.m_imgbanner() }}`.
3) Macros don't have access to **ANY** global variables set by the calling/importing templates. This means macros such as `m_sitelogo`, `m_skiplink`, `m_article` need to receive values such as `siteName`, `siteSlogan`, `skipLink` and `loggedin` via named parameters passed in by the calling template.

See commit 948677de for example upgrade of Nunjucks templates.