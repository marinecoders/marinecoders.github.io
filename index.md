---
layout: splash
feature_row:
  - title: "Projects"
    excerpt: "Learn more about our projects."
    url: "/projects/"
    btn_label: "Go to Projects"
    btn_class: "btn--inverse"
  - title: "Learn to Code"
    excerpt: "Learn more about coding, DevSecOps, and enjoy our list of free courses."
    url: "/learn/"
    btn_label: "Start Learning"
    btn_class: "btn--inverse"
  - title: "DoD DevSecOps"
    excerpt: "Learn more about the Department of Defense's software goals and enabling platforms on the Chief Software Officer's website."
    url: "https://software.af.mil"
    btn_label: "CSO Website"
    btn_class: "btn--inverse"
---
  
<br /><br />
![Marine Coders logo](/assets/images/MarineCoders.png){: .align-center}  
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

## Have questions or want to join us?
* Secure Chat: Our preferred communication method is via Platform One's Mattermost chat service.  First, [register for a Platform One account](https://login.dsop.io).  Once your account is setup, join the [Marine Coders' Chat Channel](https://chat.il2.dsop.io/signup_user_complete/?id=p65oraj9b3ysjgbxac7o7bn6fr).  If you already have an account, you can access [the Marine Coders chat channel](https://chat.il2.dsop.io/signup_user_complete/?id=p65oraj9b3ysjgbxac7o7bn6fr) directly.
* E-Mail: Send an email to collin.chew [at] usmc.mil / andrew.hutcheon [at] usmc.mil.  We would love to hear from you!
* Pursuant to MCO 5030.3B: Neither the United States Marine Corps nor any other component of the Department of Defense has approved, endorsed or authorized this activity.
* Subscribe below to be added to our distribution list:
<script type="text/javascript">var submitted=false;</script>
     <iframe name="hidden_iframe" id="hidden_iframe" style="display:none;" onload="if(submitted)  {window.location='/submission-success';}"></iframe>
    <form action="https://docs.google.com/forms/u/3/d/e/1FAIpQLScw9uOE7U9vIqRaP4lu5-zeQfYGxs2uDhwnsY2ZC5VuE5DcdQ/formResponse" method="post" target="hidden_iframe"
    onsubmit="submitted=true;">
          <label>Name</label>
          <input name="entry.907047163" type="text" placeholder="Insert Name Here" />
          <br>
          <label>Email</label>
          <input name="entry.1312101970" type="email" placeholder="Insert Email Here"/>
          <br>
          <input type="submit" value="Subscribe" />
    </form>