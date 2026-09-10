import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'AI Interview Prep Kit | Research, Targeted Questions & Flashcards',
  description: 'Turn any job description into an exhaustive personalized interview preparation kit with automated research, question bank, and study schedule.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isDevToolsMetricsError(msg, filename, stack) {
                  var m = (msg || '').toString();
                  var f = (filename || '').toString();
                  var s = (stack || '').toString();
                  return (
                    m.indexOf("Cannot read properties of undefined (reading 'startTime')") !== -1 ||
                    (m.indexOf('startTime') !== -1 && (f.indexOf('VM') !== -1 || !f || s.indexOf('reportAllChanges') !== -1))
                  );
                }

                window.addEventListener('error', function(e) {
                  if (e && isDevToolsMetricsError(e.message, e.filename, e.error && e.error.stack)) {
                    e.preventDefault();
                    if (typeof e.stopImmediatePropagation === 'function') {
                      e.stopImmediatePropagation();
                    }
                    return true;
                  }
                }, true);

                var origError = console.error;
                console.error = function() {
                  var firstArg = arguments[0];
                  var firstArgStr = typeof firstArg === 'string' ? firstArg : (firstArg && firstArg.message ? firstArg.message : '');
                  if (isDevToolsMetricsError(firstArgStr, '', (arguments[1] && arguments[1].stack) || (firstArg && firstArg.stack))) {
                    return;
                  }
                  return origError.apply(console, arguments);
                };
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
