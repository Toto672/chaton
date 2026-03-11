import React from 'react';
import { replaceLinksWithAnchors } from '../utils/detectLinks';

interface ClickableMessageProps {
  text: string;
  onLinkClick: (url: string) => void;
}

const ClickableMessage: React.FC<ClickableMessageProps> = ({ text, onLinkClick }) => {
  const processedText = replaceLinksWithAnchors(text);

  return (
    <div
      className="clickable-message"
      dangerouslySetInnerHTML={{ __html: processedText }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('clickable-link')) {
          e.preventDefault();
          const url = target.getAttribute('data-url');
          if (url) {
            onLinkClick(url);
          }
        }
      }}
    />
  );
};

export default ClickableMessage;
