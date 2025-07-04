import * as React from 'react';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatagotchiSuspenseProps {
  topMost?: boolean;
  loading?: boolean;
  enableActivityIndicator?: boolean;
  error?: Error | boolean;
  data?: boolean;
  children?: React.ReactNode;
}

const StateSkeleton: React.FC<{ children?: React.ReactNode }> = (props) => (
  <>{props.children}</>
);
StateSkeleton.displayName = 'StateSkeleton';

const StateError: React.FC<{ children?: React.ReactNode }> = (props) => (
  <>{props.children}</>
);
StateError.displayName = 'StateError';

const StateNoData: React.FC<{ children?: React.ReactNode }> = (props) => (
  <>{props.children}</>
);
StateNoData.displayName = 'StateNoData';

const StateData: React.FC<{ children?: React.ReactNode }> = (props) => (
  <>{props.children}</>
);
StateData.displayName = 'StateData';

const getTypedChildren = (children: React.ReactNode) => {
  // Filter out specific child components based on their type
  const skeleton = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === StateSkeleton,
  );
  const error = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === StateError,
  );
  const noData = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === StateNoData,
  );
  const childrenData = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === StateData,
  );

  return { skeleton, error, noData, childrenData };
};

const DefaultSkeleton = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4">
      <div className="text-4xl">🐾</div>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading your Datagotchi...</p>
    </div>
  </div>
);

const DefaultError = ({ error }: { error?: Error | boolean }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div>
        <h3 className="text-lg font-semibold text-foreground">Oops! Something went wrong</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'Failed to load data. Please try again.'}
        </p>
      </div>
    </div>
  </div>
);

const DefaultNoData = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center space-y-4 text-center">
      <Sparkles className="h-12 w-12 text-muted-foreground" />
      <div>
        <h3 className="text-lg font-semibold text-foreground">No data found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          It looks like there&apos;s nothing here yet.
        </p>
      </div>
    </div>
  </div>
);

const _DatagotchiSuspense: React.FC<DatagotchiSuspenseProps> = (props) => {
  const {
    data = true,
    enableActivityIndicator = true,
    topMost = false,
  } = props; // setting default props

  const { skeleton, error, noData, childrenData } = getTypedChildren(
    props.children,
  );

  return (
    <div className="relative">
      <React.Suspense
        fallback={
          <div className="block">
            {skeleton || <DefaultSkeleton />}
          </div>
        }
      >
        <div className={cn("hidden", props.loading && !data && "block")}>
          {skeleton || <DefaultSkeleton />}
        </div>
        <div
          className={cn("hidden", props.error && !props.loading && !data && "block")}
        >
          {error || <DefaultError error={props.error} />}
        </div>
        <div
          className={cn("hidden", !props.error && !data && !props.loading && "block")}
        >
          {noData || <DefaultNoData />}
        </div>
        <div className={cn("hidden", !!data && "block")}>
          {data && childrenData}
        </div>
        <div
          className={cn(
            "top-0 hidden absolute w-full items-center justify-center z-50 backdrop-blur-xs",
            data && props.loading && enableActivityIndicator && "flex",
            topMost && "fixed"
          )}
        >
          <div className="flex items-center space-x-2 bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 border shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-foreground">Updating...</span>
          </div>
        </div>
      </React.Suspense>
    </div>
  );
};

export const DatagotchiSuspense: React.FC<DatagotchiSuspenseProps> & {
  Skeleton: React.FC<{ children?: React.ReactNode }>;
  Error: React.FC<{ children?: React.ReactNode }>;
  NoData: React.FC<{ children?: React.ReactNode }>;
  Data: React.FC<{ children?: React.ReactNode }>;
} = Object.assign(_DatagotchiSuspense, {
  Skeleton: StateSkeleton,
  Error: StateError,
  NoData: StateNoData,
  Data: StateData,
}); 