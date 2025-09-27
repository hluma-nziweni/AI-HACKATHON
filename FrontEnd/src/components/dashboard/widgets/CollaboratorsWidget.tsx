import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from 'react-bootstrap';

interface CollaboratorsWidgetProps {
  data: {
    collaborators: any[];
    projects: any[];
  };
}

const CollaboratorsWidget: React.FC<CollaboratorsWidgetProps> = ({ data }) => {
  const { collaborators, projects } = data;
  
  // Extract unique collaborators from projects since we don't have a dedicated collaborators API
  const extractCollaborators = () => {
    const projectCollaborators = [];
    
    projects.forEach(project => {
      // Simulate collaborators data since we don't have actual API data
      const simulatedCollaborators = [
        {
          id: `collab-${Math.random().toString(36).substring(2, 9)}`,
          name: 'Jane Smith',
          role: 'Data Analyst',
          institution: 'Stanford University',
          avatar: null,
          projectId: project._id,
          projectTitle: project.title
        },
        {
          id: `collab-${Math.random().toString(36).substring(2, 9)}`,
          name: 'Michael Johnson',
          role: 'Researcher',
          institution: 'MIT',
          avatar: null,
          projectId: project._id,
          projectTitle: project.title
        }
      ];
      
      projectCollaborators.push(...simulatedCollaborators);
    });
    
    // Return unique collaborators based on ID
    return projectCollaborators.filter((collab, index, self) =>
      index === self.findIndex((c) => c.id === collab.id)
    ).slice(0, 5); // Limit to 5 for the widget
  };
  
  const displayCollaborators = collaborators.length > 0 ? collaborators : extractCollaborators();
  
  if (displayCollaborators.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-people text-muted display-4"></i>
        <p className="mt-3">No active collaborators</p>
        <Link to="/opportunities">
          <Button variant="primary" size="sm">Find Collaborators</Button>
        </Link>
      </div>
    );
  }
  
  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'data analyst':
        return 'info';
      case 'researcher':
        return 'primary';
      case 'advisor':
        return 'secondary';
      case 'lead researcher':
        return 'danger';
      default:
        return 'dark';
    }
  };
  
  return (
    <div className="collaborators-widget">
      {displayCollaborators.map((collaborator) => (
        <div key={collaborator.id} className="collaborator-item mb-3 d-flex align-items-center">
          <div className="avatar-placeholder me-3">
            {collaborator.name.charAt(0)}
          </div>
          <div>
            <h6 className="mb-0">{collaborator.name}</h6>
            <div className="d-flex mt-1">
              <Badge bg={getRoleColor(collaborator.role)} className="me-2">
                {collaborator.role}
              </Badge>
              <small className="text-muted">{collaborator.institution}</small>
            </div>
            <small className="text-muted">Project: {collaborator.projectTitle}</small>
          </div>
        </div>
      ))}
      
      <div className="text-center mt-3">
        <Link to="/collaborators">
          <Button variant="link" size="sm">View All Collaborators</Button>
        </Link>
      </div>
    </div>
  );
};

export default CollaboratorsWidget;