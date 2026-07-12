import { Link } from 'react-router-dom';
import { ShieldAlert, Compass } from 'lucide-react';
import { Button } from '@/components/common/Button';

function Shell({ code, title, message, icon: Icon }: { code: string; title: string; message: string; icon: typeof ShieldAlert }) {
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/15 text-brand">
          <Icon className="h-8 w-8" />
        </div>
        <p className="text-5xl font-black text-brand">{code}</p>
        <h1 className="mt-2 text-xl font-bold text-content">{title}</h1>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Link to="/dashboard" className="mt-6 inline-block">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return (
    <Shell
      code="403"
      title="Access denied"
      message="Your role doesn’t have permission to view this page. Contact your Fleet Manager if you need access."
      icon={ShieldAlert}
    />
  );
}

export function NotFoundPage() {
  return <Shell code="404" title="Page not found" message="The page you’re looking for doesn’t exist or has moved." icon={Compass} />;
}
