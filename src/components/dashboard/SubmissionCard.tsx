import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Calendar, FileText, Hash } from 'lucide-react';
import { SubmissionCard as SubmissionCardType } from '../../services/userSubmissionsService';

interface SubmissionCardProps {
  submission: SubmissionCardType;
}

const SubmissionCard: React.FC<SubmissionCardProps> = ({ submission }) => {
  const navigate = useNavigate();

  // Format the submission date
  const formatDate = (date: Date): string => {
    // Handle invalid dates
    if (!date || isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Rejected
          </Badge>
        );
      case 'processing':
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            Processing
          </Badge>
        );
    }
  };

  // Handle card click to navigate to user form viewer
  const handleClick = () => {
    navigate(`/submission/${submission.collection}/${submission.id}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-[#800020]"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-[#800020]">
            {submission.formType}
          </CardTitle>
          {getStatusBadge(submission.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ticket ID */}
        <div className="flex items-center gap-2 text-sm">
          <Hash className="h-4 w-4 text-[#DAA520]" />
          <span className="font-medium text-gray-700">Ticket ID:</span>
          <span className="text-gray-900 font-mono">{submission.ticketId}</span>
        </div>

        {/* Submission Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-[#DAA520]" />
          <span className="font-medium text-gray-700">Submitted:</span>
          <span className="text-gray-900">{formatDate(submission.submittedAt)}</span>
        </div>

        {/* Form Type Icon */}
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-[#DAA520]" />
          <span className="font-medium text-gray-700">Type:</span>
          <span className="text-gray-900">{submission.collection}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmissionCard;
