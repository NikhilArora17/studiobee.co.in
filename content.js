// content.js — StudioBee site content
// Edit via config.html or modify defaults below.

(function () {
  // SVG icon path data (Lucide-style, 24×24 viewBox)
  window.SB_ICONS = {
    share:     '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    brand:     '<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"/><path d="M8.5 14.5s1.5 2 3.5 2 3.5-2 3.5-2"/><path d="M9 9h.01M15 9h.01"/>',
    video:     '<path d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14v-4z"/><rect x="2" y="7" width="13" height="10" rx="2"/>',
    home:      '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>',
    cpu:       '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><path d="M12 12v3m-3-1.5h6"/>',
    globe:     '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    mail:      '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/>',
    code:      '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    users:     '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    star:      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    zap:       '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    camera:    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    monitor:   '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    megaphone: '<path d="M3 11l19-9v18L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    chart:     '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    target:    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  };

  // Default site content — edit here or override via config.html (stored in localStorage)
  var DEFAULT = {
    services: {
      heading:    "Creative services\nfor modern brands.",
      subheading: "From social content and brand identity to video, studio space, and AI automation — everything under one roof.",
      items: [
        { iconName: "share",  title: "Social Media Management",  body: "Content that stops thumbs and builds loyal communities.",          linkText: "Get started"   },
        { iconName: "brand",  title: "Branding",                  body: "A visual identity that makes your brand impossible to forget.",    linkText: "Get started"   },
        { iconName: "video",  title: "Video Production",          body: "Stories that sell — from concept to final cut.",                  linkText: "Get started"   },
        { iconName: "home",   title: "Studio Rental",             body: "Professional shoot space, fully equipped and ready to go.",       linkText: "Book a session" },
        { iconName: "cpu",    title: "Business AI Automations",   body: "Smart workflows that save hours and scale your results.",         linkText: "Get started"   }
      ]
    },

    projects: [
      { title: "Meridian Financial", type: "Branding",     owner: "James Morton",   services: ["brand strategy", "social media"],           desc: "Full brand identity and social campaign for a next-generation wealth management platform.",   media: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" },
      { title: "GreenPath",          type: "Video",         owner: "Sarah Lin",      services: ["video production", "content strategy"],     desc: "Hero video and social content series for a sustainable consumer brand launching nationally.", media: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" },
      { title: "Apex Fitness",       type: "Brand + Video", owner: "Michael Torres", services: ["branding", "video production"],             desc: "Brand refresh and launch video for a premium fitness studio expanding to three new cities.",   media: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" },
      { title: "Orbit Tech",         type: "SaaS",          owner: "David Khatri",   services: ["AI automations", "social media", "web dev"],desc: "AI-driven social strategy and full-stack web platform for a B2B automation startup.",          media: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" },
      { title: "Studio 9",           type: "Agency",        owner: "Lena Voss",      services: ["branding", "design", "web"],                desc: "End-to-end brand identity, website design, and digital presence for a creative agency.",      media: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" },
      { title: "NovaBite",           type: "F&B",           owner: "Priya Nair",     services: ["branding", "social media", "photography"],  desc: "Visual identity and content system for an upscale fast-casual restaurant group.",             media: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" },
      { title: "Solace Wellness",    type: "Wellness",      owner: "Maya Reddy",     services: ["brand identity", "video", "social media"],  desc: "Calming brand world and monthly content for a boutique wellness and mindfulness studio.",     media: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" },
      { title: "Thread & Form",      type: "Fashion",       owner: "Sophie Okafor",  services: ["branding", "social media", "photography"],  desc: "Brand launch and editorial content for an independent sustainable fashion label.",            media: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=889&fit=crop&auto=format&q=80", mediaType: "image" }
    ],

    stats: [
      { number: "40+",    label: "Brands built, campaigns launched, and videos produced" },
      { number: "5",      label: "Specialist services — all in one studio, one team, one invoice" },
      { number: "98%",    label: "Client satisfaction rate across all engagements" },
      { number: "1 roof", label: "Creative studio, production space, and AI tech under one roof" }
    ],

    process: {
      heading: "A process built\nfor real outcomes.",
      items: [
        { title: "Discover", body: "Deep-dive into your business, users, and competitive landscape to uncover what actually matters most." },
        { title: "Define",   body: "We frame the problem clearly and set direction — scope, principles, and success criteria agreed upfront." },
        { title: "Design",   body: "Iterative design cycles with rapid prototyping, user testing, and continuous refinement until it's right." },
        { title: "Deploy",   body: "From handoff to launch and beyond — we support implementation and measure real-world performance." }
      ]
    },

    team: [
      {
        name:     "Anya Sharma",
        role:     "Creative Director",
        bio:      "10+ years crafting brand identities and digital experiences for startups and global brands. Obsessed with the space where storytelling meets design.",
        skills:   ["Brand Strategy", "Art Direction", "UX Design"],
        photo:    "https://placehold.co/400x500/111827/4f64f0",
        linkedin: ""
      },
      {
        name:     "Rohan Mehta",
        role:     "Head of Video Production",
        bio:      "Award-winning director with roots in documentary and commercial film. Brings cinematic precision to every social reel and brand film we produce.",
        skills:   ["Cinematography", "Editing", "Motion Design"],
        photo:    "https://placehold.co/400x500/111827/4f64f0",
        linkedin: ""
      },
      {
        name:     "Priya Nair",
        role:     "Social Media Strategist",
        bio:      "Built communities from zero to millions for D2C brands. Lives and breathes platform algorithms, cultural trends, and audience psychology.",
        skills:   ["Content Strategy", "Paid Social", "Analytics"],
        photo:    "https://placehold.co/400x500/111827/4f64f0",
        linkedin: ""
      },
      {
        name:     "Dev Kapoor",
        role:     "AI Automation Lead",
        bio:      "Former ML engineer turned creative technologist. Designs intelligent workflows that help brands scale faster without adding headcount.",
        skills:   ["AI/ML", "Workflow Automation", "No-Code"],
        photo:    "https://placehold.co/400x500/111827/4f64f0",
        linkedin: ""
      }
    ],

    testimonials: [
      { quote: "studiobee completely transformed how our brand looks and feels online. The branding, the social content, the videos — everything is cohesive and genuinely impressive.",        name: "James Morton", role: "Founder, Meridian Financial" },
      { quote: "The AI automations they built saved us hours every week. Our entire back-end runs smoother than ever — I can't imagine going back to the old way of doing things.",           name: "Sarah L.",     role: "CEO, GreenPath" },
      { quote: "Rented the studio for a product shoot — top-tier setup, seamless to book, and the final photos exceeded every expectation we had going in.",                                  name: "David K.",     role: "Creative Director, Orbit Tech" },
      { quote: "Their social media management tripled our engagement in three months. They genuinely understand how to build an audience and keep them coming back.",                          name: "Michael T.",   role: "Owner, Apex Fitness" },
      { quote: "We went from zero online presence to a brand people actually recognise. The whole team at studiobee are incredibly talented and a pleasure to work with.",                     name: "Priya N.",     role: "Co-founder, NovaBite" }
    ]
  };

  // Deep-merge helper
  function merge(target, src) {
    var out = Object.assign({}, target);
    for (var k in src) {
      if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]))
        out[k] = merge(target[k] || {}, src[k]);
      else
        out[k] = src[k];
    }
    return out;
  }

  // Prefer server-injected config (works across all devices/origins),
  // fall back to localStorage for local Live Server previews.
  var override = {};
  try {
    var serverCfg = (typeof window.__SITE_CONFIG__ !== 'undefined') ? window.__SITE_CONFIG__ : null;
    var localCfg  = JSON.parse(localStorage.getItem('studiobee_content') || 'null');
    override = serverCfg || localCfg || {};
  } catch (e) {}

  window.SC         = (override && Object.keys(override).length) ? merge(DEFAULT, override) : DEFAULT;
  window.SC_DEFAULT = DEFAULT;

  // On production (Vercel), server-side config injection is unavailable.
  // Fetch config from /api/config, update localStorage if changed, reload once.
  // Subsequent page loads skip the reload (localStorage already matches).
  if (typeof window.__SITE_CONFIG__ === 'undefined'
      && location.hostname !== 'localhost'
      && location.hostname !== '127.0.0.1') {
    fetch('/api/config')
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(cfg) {
        if (!cfg) return;
        var incoming = JSON.stringify(cfg);
        var current  = localStorage.getItem('studiobee_content') || 'null';
        if (incoming === current) return;
        localStorage.setItem('studiobee_content', incoming);
        location.reload();
      })
      .catch(function() {});
  }
})();
