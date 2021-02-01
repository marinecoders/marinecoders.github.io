---
layout: splash
feature_row:
  - title: "Projects"
    excerpt: "Learn more about our projects."
    url: "/projects/"
    btn_label: "Go to Projects"
    btn_class: "btn--inverse"
  - title: "Join Marine Coders"
    excerpt: "Signup and join our mailing list and chat!"
    url: "/subscribe/"
    btn_label: "Join"
    btn_class: "btn--inverse"
  - title: "Learn to Code"
    excerpt: "Learn more about coding, DevSecOps, and enjoy our list of free courses."
    url: "/learn/"
    btn_label: "Start Learning"
    btn_class: "btn--inverse"
---
<br /><br />
![Marine Coders logo](/assets/images/Marine Coders Logo.png){: .align-center}  
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

***Pursuant to MCO 5030.3B: Neither the United States Marine Corps nor any other component of the Department of Defense has approved, endorsed or authorized this activity***
