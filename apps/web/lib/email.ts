import { logger } from 'better-auth';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || crypto.randomUUID(); // For testing purposes
if (!RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
}
const resend = new Resend(RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'Dory<noreply@getdory.dev>';

export async function sendEmail({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    const from = EMAIL_FROM;
    logger.info(`[email] payload to=${to} subject="${subject}" html=${Boolean(html)} htmlLen=${html?.length || 0} textLen=${text?.length || 0}`);
    try {
        const { data, error } = await resend.emails.send({
            from,
            to,
            subject,
            text,
            ...(html ? { html } : {}),
        });
        logger.info(`Email queued: id=${data?.id} -> ${to} "${subject}"`);
    } catch (error) {
        logger.error('Resend send exception', error);
        throw error;
    }

}
