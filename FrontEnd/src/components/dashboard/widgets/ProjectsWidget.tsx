import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from 'react-bootstrap';

interface ProjectsWidgetProps {
  data: {
    projects: any[];
  };
}

const ProjectsWidget: React.FC<ProjectsWidgetProps> = ({ data }) => {
  const { projects } = data;
  
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
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
  
  if (projects.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-briefcase text-muted display-4"></i>
        <p className="mt-3">No active projects</p>
        <Link to="/opportunities">
          <Button variant="primary" size="sm">Find Opportunities</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="projects-widget">
      {projects.slice(0, 3).map((project) => (
        <div key={project._id} className="project-item mb-3">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex mb-2">
                <Badge bg="primary" className="me-2">{project.research_area}</Badge>
                <Badge bg={getRoleColor(project.role || '')}>
                  {project.role || 'Collaborator'}
                </Badge>
              </div>
              <h6>{project.title}</h6>
              <p className="text-muted small mb-1">
                {project.description?.length > 100
                  ? `${project.description.substring(0, 100)}...`
                  : project.description}
              </p>
              <div className="project-meta small">
                <span className="me-3">
                  {project.institution || 'Unknown Institution'}
                </span>
                <span>
                  {project.start_date && project.end_date ?
                    `${formatDate(project.start_date).split(',')[0]} - ${formatDate(project.end_date).split(',')[0]}` :
                    'Dates not specified'}
                </span>
              </div>
            </div>
            <Badge bg={project.status === 'Active' ? 'success' : 'warning'}>
              {project.status || 'Active'}
            </Badge>
          </div>
        </div>
      ))}
      
      {projects.length > 3 && (
        <div className="text-center mt-3">
          <Link to="/projects">
            <Button variant="link" size="sm">View All Projects ({projects.length})</Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ProjectsWidget;