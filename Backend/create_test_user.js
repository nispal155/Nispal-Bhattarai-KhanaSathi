async function createTestUser() {
    try {
        const response = await fetch('http://localhost:5003/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'customer'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('User created:', data);
        } else if (response.status === 400 && data.message === 'User already exists') {
            console.log('Test user already exists, ready to login.');
        } else {
            console.error('Error creating user:', data);
        }
    } catch (error) {
        console.error('Network error:', error.message);
    }
}

createTestUser();
