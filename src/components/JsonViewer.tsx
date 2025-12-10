import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface JsonViewerProps {
  data: any;
  name?: string;
  depth?: number;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, name, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2);

  const copyToClipboard = (value: any) => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    toast.success('Copied to clipboard');
  };

  if (data === null) {
    return <span className="text-gray-500">null</span>;
  }

  if (data === undefined) {
    return <span className="text-gray-500">undefined</span>;
  }

  if (typeof data === 'string') {
    return <span className="text-green-600">"{data}"</span>;
  }

  if (typeof data === 'number') {
    return <span className="text-blue-600">{data}</span>;
  }

  if (typeof data === 'boolean') {
    return <span className="text-purple-600">{data.toString()}</span>;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-gray-500">[]</span>;
    }

    return (
      <div className="ml-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 hover:bg-gray-100 px-1 rounded"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="text-gray-600">Array[{data.length}]</span>
        </button>
        {isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {data.map((item, index) => (
              <div key={index} className="my-1">
                <span className="text-gray-500">{index}: </span>
                <JsonViewer data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object') {
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return <span className="text-gray-500">{'{}'}</span>;
    }

    return (
      <div className="ml-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 hover:bg-gray-100 px-1 rounded"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span className="text-gray-600">
              {name ? `${name} ` : ''}Object{'{'}
              {keys.length}
              {'}'}
            </span>
          </button>
          <button
            onClick={() => copyToClipboard(data)}
            className="p-1 hover:bg-gray-100 rounded"
            title="Copy to clipboard"
          >
            <Copy size={14} />
          </button>
        </div>
        {isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
            {keys.map((key) => (
              <div key={key} className="my-1">
                <span className="text-orange-600 font-medium">{key}: </span>
                <JsonViewer data={data[key]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <span>{String(data)}</span>;
};
