const OpenAI = require('openai');
const Expense = require('../models/expense');
const User = require('../models/user');

const modelName = 'gpt-4o-mini';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const analyzeExpenses = async (userId) => {
    try {
        console.log('Analyzing expenses for user:', userId);
        const expenses = await Expense.findByUserId(userId);

        if (!expenses.length) {
            return "I don't see any expenses yet. Start adding your expenses to get personalized insights!";
        }

        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Group expenses by category
        const categoryTotals = expenses.reduce((acc, expense) => {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
            return acc;
        }, {});

        // Find top spending categories
        const topCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        // Calculate monthly average
        const firstExpense = expenses[expenses.length - 1];
        const lastExpense = expenses[0];
        const monthsDiff = (new Date(lastExpense.date) - new Date(firstExpense.date)) / (1000 * 60 * 60 * 24 * 30);
        const monthlyAverage = totalExpenses / Math.max(1, monthsDiff);

        // Generate insights using OpenAI
        const prompt = `Based on the following expense data, provide a brief financial analysis and personalized saving tips:
            - Total Expenses: ₹${totalExpenses.toLocaleString('en-IN')}
            - Monthly Average: ₹${monthlyAverage.toLocaleString('en-IN')}
            - Top Spending Categories: ${topCategories.map(([cat, amt]) => `${cat} (₹${amt.toLocaleString('en-IN')})`).join(', ')}
            - Number of Transactions: ${expenses.length}
            
            Please provide:
            1. A brief analysis of spending patterns
            2. 2-3 personalized saving tips based on the data
            3. Suggestions for potential budget optimizations
            
            Keep the response concise and friendly.`;

        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "system",
                    content: "You are a helpful financial assistant that provides concise and friendly advice about personal finances and expense tracking. All monetary values are in Indian Rupees (INR)."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            // max_tokens: 250,
            // temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing expenses:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        return "I apologize, but I'm having trouble analyzing your expenses at the moment. Please try again later.";
    }
};

const handleChatMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Please log in to use the chat feature' });
        }

        if (!message.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // Check if the message is asking for expense analysis
        const analysisKeywords = ['analyze', 'summary', 'overview', 'report', 'insights', 'spending', 'expenses'];
        const isAnalysisRequest = analysisKeywords.some(keyword => 
            message.toLowerCase().includes(keyword)
        );

        if (isAnalysisRequest) {
            const analysis = await analyzeExpenses(userId);
            return res.json({ response: analysis });
        }

        // For general questions, use OpenAI to generate a response
        const response = await openai.chat.completions.create({
            model: modelName,
            messages: [
                {
                    role: "system",
                    content: `You are a helpful financial assistant for an expense tracking application. 
                    Please provide responses that:
                    1. Are concise and friendly
                    2. Focus on personal finance and expense tracking
                    3. Include practical tips when relevant
                    4. Avoid technical jargon
                    5. Use Indian Rupees (₹) as the currency
                    
                    If the user is asking about features, mention that they can:
                    - Add new expenses
                    - View expense history
                    - Get spending analysis
                    - Generate reports
                    - Set budgets`
                },
                {
                    role: "user",
                    content: message
                }
            ],
            // max_tokens: 150,
            // temperature: 0.7
        });

        res.json({ response: response.choices[0].message.content });
    } catch (error) {
        console.error('Error in chat:', error);
        if (error.response) {
            console.error('API Response:', error.response.data);
        }
        res.status(500).json({ 
            error: 'Failed to process chat message',
            details: error.message 
        });
    }
};

module.exports = {
    handleChatMessage
}; 