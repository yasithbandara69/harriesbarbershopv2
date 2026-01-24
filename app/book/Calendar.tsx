'use client';

import { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  isBefore, 
  startOfDay 
} from 'date-fns';
import styles from './calendar.module.css';

interface CalendarProps {
  value: string;
  onChange: (date: string) => void;
}

export default function Calendar({ value, onChange }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Parse the selected date if it exists, otherwise null
  const selectedDate = value ? new Date(value + 'T00:00:00') : null; // Append time to ensure local date parsing if needed, but safer to treat value as YYYY-MM-DD
  // Actually, standardizing on local date strings:
  // We will compare dates by formatting them to 'yyyy-MM-dd' to avoid timezone issues with pure comparisons.
  
  const width = 350;

  const prevMonth = () => {
    // Prevent going back past current month if real-world usage dictates? 
    // Usually we just let them navigate but disable past days selection.
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const onDateClick = (day: Date) => {
    // Prevent selecting past days
    if (isBefore(day, startOfDay(new Date()))) {
        return;
    }
    onChange(format(day, 'yyyy-MM-dd'));
  };

  const renderHeader = () => {
    return (
      <div className={styles.header}>
        <button className={styles.navButton} onClick={prevMonth} disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(new Date()))}>
          &lt;
        </button>
        <span className={styles.title}>
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button className={styles.navButton} onClick={nextMonth}>
          &gt;
        </button>
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const today = startOfDay(new Date());

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
        const isDisabled = isBefore(day, today);
        const isOutsideMonth = !isSameMonth(day, monthStart);

        days.push(
          <div
            className={`
              ${styles.day} 
              ${!isSameMonth(day, monthStart) ? styles.outsideMonth : ""} 
              ${isSelected ? styles.selected : ""}
              ${isDisabled ? styles.disabled : ""}
            `}
            key={day.toString()}
            onClick={() => !isDisabled && onDateClick(cloneDay)}
          >
            <span>{formattedDate}</span>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className={styles.days} key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <div className={styles.calendar}>
      {renderHeader()}
      <div className={styles.weekDays}>
         {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
         ))}
      </div>
      {renderCells()}
    </div>
  );
}
