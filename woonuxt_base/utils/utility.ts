export function isChromeBrowser(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('chrome') && userAgent.includes('edge') && !userAgent.includes('opr') && !userAgent.includes('brave');
}

export function getBrowserName(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent;
}
