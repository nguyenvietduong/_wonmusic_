export async function register() {
    // Chỉ chạy trên Node.js server (không chạy trên Edge runtime)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { seedDB } = await import('./lib/seed')
        await seedDB()
    }
}
