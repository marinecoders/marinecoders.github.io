---
layout: splash
feature_row:
  - title: "Projects"
    excerpt: "Learn more about our projects."
    url: "/projects/"
    btn_label: "Go to Projects"
    btn_class: "btn--inverse"
  - title: "Join Marine Coders Chat"
    excerpt: "Let's build together."
    url: "/chat/"
    btn_label: "Join"
    btn_class: "btn--info"
  - title: "Learn to Code"
    excerpt: "Learn more about coding, DevSecOps, and enjoy our list of free courses."
    url: "/learn/"
    btn_label: "Start Learning"
    btn_class: "btn--inverse"

description: Marine Coders is a non-official organization comprised of Active Duty/Reserve Marines, Marine Veterans, and U.S. Citizens who want to help Marines through code.
---
<br /><br />
![Marine Coders logo](/assets/images/marinecoders.png){: .align-center}  
{% include feature_row %}
<h3 class="archive__subtitle">{{ site.data.ui-text[site.locale].recent_posts | default: "Recent Posts" }}</h3>

{% if paginator %}
  {% assign posts = paginator.posts %}
{% else %}
  {% assign posts = site.posts %}
{% endif %}

{% for post in posts %}
  {% include archive-single.html %}
{% endfor %}

{% include paginator.html %}


