# Upgrading to Nunjucks 3

1) Macros import statement changes to this format `{% import "./_macros.htm" as m %}`
2) All macro calls have to be prefixed with `m.` – so `{{ m_imgbanner() }}` becomes `{{ m.m_imgbanner() }}`.  
**NOTE:** If you strip away the `m_` prefix, then make sure to resolve collision between mixin parameters and names of locally called mixins. Examples: 
   - `m_paging` → `pagingUi`
   - `m_buttons` → `buttonsUi`
   - `m_comments` → `commentsUi`
3) Macros don't have access to **ANY** global variables set by the calling/importing templates. This means macros such as `m_sitelogo`, `m_skiplink`, `m_article`, etc. need to receive values such as `siteName`, `siteSlogan`, `skipLink` and `loggedin` via named parameters passed in by the calling template.

(See example of Nunjucks template upgrade in commit `a290a2` in the `template` repo.)