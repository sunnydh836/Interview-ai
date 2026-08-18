async function measure(name, url) {
    const start = Date.now();
    try {
        const res = await fetch(url);
        const duration = Date.now() - start;
        console.log(`${name}: HTTP ${res.status} in ${duration}ms`);
        return duration;
    } catch (err) {
        const duration = Date.now() - start;
        console.log(`${name} Failed: ${err.message} in ${duration}ms`);
        return null;
    }
}

async function run() {
    console.log("Measuring Health Endpoint Response Times...\n");
    
    // Test 1: Production (Render) - 1st request (may trigger cold start)
    console.log("Requesting Production (First request, possible cold start)...");
    await measure("Production Run 1", "https://interview-ai-backend-6rtv.onrender.com/");
    
    // Test 2: Production (Render) - 2nd request
    console.log("Requesting Production (Second request)...");
    await measure("Production Run 2", "https://interview-ai-backend-6rtv.onrender.com/");

    // Test 3: Production (Render) - 3rd request
    console.log("Requesting Production (Third request)...");
    await measure("Production Run 3", "https://interview-ai-backend-6rtv.onrender.com/");
    
    console.log("\nRequesting Local Backend...");
    // Test 4: Local - 1st request
    await measure("Local Run 1", "http://localhost:3000/");
    
    // Test 5: Local - 2nd request
    await measure("Local Run 2", "http://localhost:3000/");
}

run();
