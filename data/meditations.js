export const meditations = [
    { id: '1', title: 'Sounds', subtitle: 'Listen to the sounds around you', type: 'sounds', icon: 'sounds' },
    { id: '2', title: 'Body Scan', subtitle: 'Focus on the feelings in your body starting from your toes', type: 'bodyscan', icon: 'bodyscan' },
    { id: '3', title: 'Breath Awareness', subtitle: 'Focus on your breath and the sensation of each inhale and exhale', type: 'breath', icon: 'breath' },
    { id: '4', title: 'Leaves on a Stream', subtitle: 'Observe your thoughts like leaves floating down a stream', type: 'leaves', icon: 'leaves' }
];

export function getRandomMeditation() {
    return meditations[Math.floor(Math.random() * meditations.length)];
}

export function resolveMeditation(id) {
    if (id === 'random') return getRandomMeditation();
    return meditations.find((m) => m.id === id);
}