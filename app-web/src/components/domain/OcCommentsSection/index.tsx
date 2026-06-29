'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { feedback } from '@/services/feedback';
import { formatDateTime } from '@/lib/format/date';
import type { OcComment } from '@/lib/mock/types';
import styles from './styles.module.scss';

export function OcCommentsSection({ comments }: { comments: OcComment[] }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    feedback.success('Comentário adicionado.');
    setText('');
  };

  return (
    <div id="comentarios" className={styles.section}>
      <div className={styles.list}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            <Avatar name={comment.author} size="sm" />
            <div className={styles.commentBody}>
              <div className={styles.commentHeader}>
                <span className={styles.author}>{comment.author}</span>
                <span className={styles.date}>{formatDateTime(comment.at)}</span>
              </div>
              <p className={styles.text}>{comment.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className={styles.empty}>Nenhum comentário ainda.</p>}
      </div>

      <div className={styles.form}>
        <Textarea
          placeholder="Escreva um comentário..."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <Button onClick={handleSubmit} className={styles.submitButton}>
          Comentar
        </Button>
      </div>
    </div>
  );
}
