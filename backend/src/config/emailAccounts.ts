import { EmailAccount } from '../types';

export const emailAccounts: EmailAccount[] = [
  {
    id: 'account1',
    host: process.env.EMAIL_ACCOUNT_1_HOST!,
    port: Number(process.env.EMAIL_ACCOUNT_1_PORT!),
    user: process.env.EMAIL_ACCOUNT_1_USER!,
    password: process.env.EMAIL_ACCOUNT_1_PASS!,
    tls: process.env.EMAIL_ACCOUNT_1_TLS === 'true',
    label: 'Account 1',
  },
  {
    id: 'account2',
    host: process.env.EMAIL_ACCOUNT_2_HOST!,
    port: Number(process.env.EMAIL_ACCOUNT_2_PORT!),
    user: process.env.EMAIL_ACCOUNT_2_USER!,
    password: process.env.EMAIL_ACCOUNT_2_PASS!,
    tls: process.env.EMAIL_ACCOUNT_2_TLS === 'true',
    label: 'Account 2',
  },
];