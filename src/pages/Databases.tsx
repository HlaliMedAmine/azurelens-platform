import { Database } from "lucide-react";

export default function Databases() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          Databases
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Azure SQL · Cosmos DB · PostgreSQL · Redis Cache
        </p>
      </div>

      {/* Coming Soon Card */}
      <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Database className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Database scanning coming soon</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Support for Azure SQL, Cosmos DB, PostgreSQL, and Redis Cache
            is under development. This feature requires additional Azure
            permissions to scan database usage and costs.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground mt-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Azure SQL — requires <code className="bg-muted px-1 rounded">Microsoft.Sql/servers/read</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Cosmos DB — requires <code className="bg-muted px-1 rounded">Microsoft.DocumentDB/databaseAccounts/read</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            PostgreSQL — requires <code className="bg-muted px-1 rounded">Microsoft.DBforPostgreSQL/servers/read</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Redis Cache — requires <code className="bg-muted px-1 rounded">Microsoft.Cache/redis/read</code>
          </div>
        </div>
      </div>
    </div>
  );
}