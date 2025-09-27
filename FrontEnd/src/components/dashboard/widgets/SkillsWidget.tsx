import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Badge } from 'react-bootstrap';

interface SkillsWidgetProps {
  data: any; // Can be extended if needed
}

const SkillsWidget: React.FC<SkillsWidgetProps> = () => {
  // This would normally come from the user profile API
  const mockSkills = {
    researchAreas: ['Machine Learning', 'Data Analysis', 'Neuroscience'],
    technicalSkills: ['Python', 'R', 'Statistical Analysis', 'MATLAB'],
    publications: 3
  };
  
  return (
    <div className="skills-widget">
      <div className="skills-section">
        <h6>Research Areas</h6>
        <div className="mb-3">
          {mockSkills.researchAreas.map((skill, index) => (
            <Badge bg="primary" className="me-2 mb-2" key={index}>{skill}</Badge>
          ))}
          <Badge bg="light" text="dark" className="mb-2">+ Add</Badge>
        </div>
        
        <h6>Technical Skills</h6>
        <div className="mb-3">
          {mockSkills.technicalSkills.map((skill, index) => (
            <Badge bg="secondary" className="me-2 mb-2" key={index}>{skill}</Badge>
          ))}
          <Badge bg="light" text="dark" className="mb-2">+ Add</Badge>
        </div>
        
        <h6>Publications</h6>
        <p className="small text-muted">{mockSkills.publications} publications in peer-reviewed journals</p>
        
        <div className="text-center mt-3">
          <Link to="/profile/skills">
            <Button variant="outline-primary" size="sm">
              Update Skills Profile
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SkillsWidget;