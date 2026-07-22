export const meditations = [
    { id: '1', title: 'Sounds', type: 'sounds', icon: 'sounds' },
    { id: '2', title: 'Body Scan', type: 'bodyscan', icon: 'bodyscan' },
    { id: '3', title: 'Breath Awareness', type: 'breath', icon: 'breath' },
    { id: '4', title: 'Leaves on the Shore', type: 'leaves', icon: 'leaves' }
];

export function getRandomMeditation() {
    return meditations[Math.floor(Math.random() * meditations.length)];
}

export function resolveMeditation(id) {
    if (id === 'random') return getRandomMeditation();
    return meditations.find((m) => m.id === id);
}