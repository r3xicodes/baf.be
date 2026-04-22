const searchData = [
    { title: 'Home', content: 'Welcome to the Belgian Air Force virtual MILSIM website. Force Aérienne Belge. Military simulation, training, operations, careers, news, contact.', url: '../index.html', category: 'main', type: 'page', priority: 10 },
    { title: 'F-16 Fighting Falcon', content: 'F-16 Fighting Falcon aircraft factsheet. Multirole fighter, air superiority, ground attack, Belgian Air Force fighter jet, avionics, weapons systems.', url: 'aircraft-f16-fighting-falcon.html', category: 'aircraft', type: 'factsheet', priority: 8 },
    { title: 'F-35A Lightning II', content: 'F-35A Lightning II fifth-generation fighter. Stealth technology, advanced avionics, supersonic capabilities, Belgian Air Force next-generation fighter.', url: 'aircraft-f35a-lightning-ii.html', category: 'aircraft', type: 'factsheet', priority: 8 },
];

function fuzzyMatch(query, text) {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return 1.0;
    let score = 0;
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) {
            score++;
            qi++;
        }
    }
    return qi === q.length ? score / t.length : 0;
}

function calculateRelevance(item, query) {
    let score = 0;
    const lowerQuery = query.toLowerCase();
    const titleScore = fuzzyMatch(query, item.title);
    if (titleScore > 0) score += titleScore * 10;
    const contentScore = fuzzyMatch(query, item.content);
    if (contentScore > 0) score += contentScore * 5;
    if (item.category && item.category.toLowerCase().includes(lowerQuery)) score += 4;
    if (item.type && item.type.toLowerCase().includes(lowerQuery)) score += 3;
    if (item.url && item.url.toLowerCase().includes(lowerQuery)) score += 2;
    score += item.priority || 0;
    if (item.title.toLowerCase().includes(lowerQuery)) score += 3;
    if (item.content.toLowerCase().includes(lowerQuery)) score += 2;
    return score;
}

['f16', 'F-16', 'aircraft', 'fighter', 'home', 'news'].forEach(q => {
    console.log('query', q);
    searchData.forEach(item => console.log(item.title, calculateRelevance(item, q)));
    console.log('---');
});
