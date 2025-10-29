import { User, TrackableGoal, AnalysisReport } from '../../types';
import { supabase } from '../../lib/supabaseClient';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

/**
 * Simulates sending an email by logging the intended action.
 * In a real application, this would invoke a Supabase Edge Function.
 * @param options - The email options (to, subject, html).
 */
export const sendEmailNotification = async (options: EmailOptions): Promise<{ success: boolean; error?: string }> => {
    // This function demonstrates how you would call a Supabase Edge Function named 'send-email'.
    // To make this work for real, deploy the `send-email` function to your Supabase project
    // and uncomment the code block below.
    console.log("--- [DEMO] INVOKING SUPABASE EDGE FUNCTION 'send-email' ---");
    console.log(`Payload: { to: "${options.to}", subject: "${options.subject}" }`);
    console.log("---------------------------------------------------------");
    
    /*
    // UNCOMMENT THIS BLOCK FOR A REAL IMPLEMENTATION
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: { to: options.to, subject: options.subject, html: options.html },
        });

        if (error) throw error;
        
        console.log("Function response:", data);
        return { success: true };

    } catch (error) {
        console.error("Error invoking Supabase function:", error);
        return { success: false, error: (error as Error).message };
    }
    */

    // For demonstration, we'll simulate a successful call without actually invoking.
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("--- SIMULATION SUCCESS ---");
    return { success: true };
};

const emailWrapper = (content: string) => `
    <div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #06f9e0; padding: 24px; text-align: center;">
            <h1 style="color: #111; margin: 0; font-size: 28px;">Oratora</h1>
        </div>
        <div style="padding: 24px;">
            ${content}
        </div>
        <div style="background-color: #f7f7f7; padding: 16px; text-align: center; font-size: 12px; color: #777;">
            <p>You're receiving this because you're awesome (and you signed up for Oratora).</p>
            <p>&copy; ${new Date().getFullYear()} Oratora Inc. All rights reserved.</p>
        </div>
    </div>
`;

export const generateWelcomeEmail = (user: User): { subject: string, html: string } => {
    const subject = "Welcome to the First Day of the Rest of Your (Less Awkward) Life";
    const content = `
        <h2 style="font-size: 22px; color: #111;">Hey ${user.name.split(' ')[0] || 'there'},</h2>
        <p>Congrats on joining Oratora. We're here to turn your 'ums' and 'ahs' into applause. No more staring at your shoes during presentations.</p>
        <p>Let's do this. (Or don't. Your call.)</p>
        <a href="#" style="display: inline-block; background-color: #06f9e0; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; margin-top: 16px;">Go to Dashboard</a>
    `;
    return { subject, html: emailWrapper(content) };
};

export const generateGoalCompletionEmail = (user: User, goal: TrackableGoal): { subject: string, html: string } => {
    const subject = `You... actually did it. Goal Completed!`;
    const content = `
        <h2 style="font-size: 22px; color: #111;">Well, look at you, ${user.name.split(' ')[0]}.</h2>
        <p>You completed your goal: <strong>"${goal.title}"</strong>.</p>
        <p>We're not saying we're surprised, but we're not <em>not</em> saying it. Keep this up and you might actually become a decent speaker. Maybe.</p>
        <p>Time to set a new, even more ambitious goal that you'll probably forget about?</p>
        <a href="#" style="display: inline-block; background-color: #06f9e0; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; margin-top: 16px;">Set a New Goal</a>
    `;
    return { subject, html: emailWrapper(content) };
};

export const generatePracticeReminderEmail = (user: User, progressStatus: 'low_progress' | 'high_progress'): { subject: string, html: string } => {
    if (progressStatus === 'low_progress') {
        const subject = "Is this thing on? 🎤";
        const content = `
            <h2 style="font-size: 22px; color: #111;">Hey ${user.name.split(' ')[0]},</h2>
            <p>Your public speaking goals called. They're feeling a bit neglected. Remember them? Tall, ambitious, currently gathering dust?</p>
            <p>Your filler words are throwing a party in your absence. Just saying. Maybe pop in and say hi?</p>
            <a href="#" style="display: inline-block; background-color: #06f9e0; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; margin-top: 16px;">Practice Now</a>
        `;
        return { subject, html: emailWrapper(content) };
    } else {
        const subject = "You're on fire! (in a good way)";
        const content = `
            <h2 style="font-size: 22px; color: #111;">Seriously, ${user.name.split(' ')[0]},</h2>
            <p>Your consistency is amazing. Keep up the momentum, superstar. We're already preparing your TED Talk.</p>
            <a href="#" style="display: inline-block; background-color: #06f9e0; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; margin-top: 16px;">Keep the Streak Alive</a>
        `;
        return { subject, html: emailWrapper(content) };
    }
};

export const generateNewFeatureEmail = (user: User): { subject: string, html: string } => {
    const subject = "New toys to play with.";
    const content = `
        <h2 style="font-size: 22px; color: #111;">Hey ${user.name.split(' ')[0]},</h2>
        <p>We built something new. It’s pretty cool. You should probably check it out if you’re actually serious about this whole 'improving yourself' thing.</p>
        <p>No pressure.</p>
        <a href="#" style="display: inline-block; background-color: #06f9e0; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; margin-top: 16px;">See What's New</a>
    `;
    return { subject, html: emailWrapper(content) };
};

export const generateWeeklySummaryEmail = (user: User, history: AnalysisReport[]): { subject: string, html: string } => {
    const sessionsThisWeek = history.filter(h => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(h.sessionDate) > oneWeekAgo;
    }).length;

    const subject = "Your Oratora Weekly Report Card 🚀";
    const content = `
        <h2 style="font-size: 22px; color: #111;">Hi ${user.name.split(' ')[0]},</h2>
        <p>Here's your weekly summary from Oratora. Let's see how you did...</p>
        <div style="background-color: #f0f8ff; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <p style="font-size: 16px; margin: 0;">Sessions This Week:</p>
            <p style="font-size: 48px; font-weight: bold; margin: 8px 0; color: #06f9e0;">${sessionsThisWeek}</p>
        </div>
        ${sessionsThisWeek > 0 
            ? "<p>Nice work! Keep that momentum going. Or don't. We're not your boss.</p>" 
            : "<p>Zero sessions? Really? Your future self is judging you right now. We are too, a little bit.</p>"
        }
        <p>Ready to prove us wrong (or right)?</p>
        <a href="#" style="display: inline-block; background-color: #06f9e0; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 99px; font-weight: bold; margin-top: 16px;">Start a New Session</a>
    `;
    return { subject, html: emailWrapper(content) };
};