import { Box, Typography, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import type { DateTreeNode } from '../types';
import { treeItemSx } from '../styles/albumSx';
import { alpha } from '@mui/material/styles';

interface Props {
  dateTree: DateTreeNode[];
  selectedDate: { year?: number; month?: number; day?: number };
  expandedYears: Set<number>;
  expandedMonths: Set<string>;
  onSelectDate: (year?: number, month?: number, day?: number) => void;
  onToggleYear: (year: number) => void;
  onToggleMonth: (year: number, month: number) => void;
}

export const DateTree = ({
  dateTree,
  selectedDate,
  expandedYears,
  expandedMonths,
  onSelectDate,
  onToggleYear,
  onToggleMonth,
}: Props) => {
  const isYearActive = (y: number) =>
    selectedDate.year === y && !selectedDate.month;
  const isMonthActive = (y: number, m: number) =>
    selectedDate.year === y && selectedDate.month === m && !selectedDate.day;
  const isDayActive = (y: number, m: number, d: number) =>
    selectedDate.year === y && selectedDate.month === m && selectedDate.day === d;

  return (
    <Box>
      {/* 全て表示 */}
      <Box
        sx={{
          ...treeItemSx(!selectedDate.year),
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 0.5,
        }}
        onClick={() => onSelectDate()}
      >
        <CalendarTodayIcon sx={{ fontSize: 14 }} />
        <Typography variant="body2" fontWeight={600}>すべて</Typography>
      </Box>

      {dateTree.map(({ year, months }) => (
        <Box key={year}>
          {/* 年 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              ...treeItemSx(isYearActive(year)),
              mt: 0.5,
            }}
          >
            <IconButton
              size="small"
              onClick={() => onToggleYear(year)}
              sx={{ p: 0.3, mr: 0.3, color: 'text.secondary' }}
            >
              {expandedYears.has(year) ? (
                <ExpandMoreIcon sx={{ fontSize: 16 }} />
              ) : (
                <ChevronRightIcon sx={{ fontSize: 16 }} />
              )}
            </IconButton>
            <Typography
              variant="body2"
              fontWeight={700}
              onClick={() => onSelectDate(year)}
              sx={{ cursor: 'pointer', flex: 1 }}
            >
              {year}年
            </Typography>
          </Box>

          <Collapse in={expandedYears.has(year)}>
            {months.map(({ month, days }) => (
              <Box key={month} sx={{ pl: 2 }}>
                {/* 月 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    ...treeItemSx(isMonthActive(year, month)),
                    mt: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => onToggleMonth(year, month)}
                    sx={{ p: 0.2, mr: 0.3, color: 'text.secondary' }}
                  >
                    {expandedMonths.has(`${year}-${month}`) ? (
                      <ExpandMoreIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <ChevronRightIcon sx={{ fontSize: 14 }} />
                    )}
                  </IconButton>
                  <Typography
                    variant="body2"
                    onClick={() => onSelectDate(year, month)}
                    sx={{ cursor: 'pointer', flex: 1, color: alpha('#c4b5fd', 0.9) }}
                  >
                    {month}月
                  </Typography>
                </Box>

                <Collapse in={expandedMonths.has(`${year}-${month}`)}>
                  {days.map((day) => (
                    <Box
                      key={day}
                      sx={{
                        pl: 3,
                        ...treeItemSx(isDayActive(year, month, day)),
                        mt: 0.2,
                      }}
                      onClick={() => onSelectDate(year, month, day)}
                    >
                      <Typography variant="caption" sx={{ color: 'inherit' }}>
                        {day}日
                      </Typography>
                    </Box>
                  ))}
                </Collapse>
              </Box>
            ))}
          </Collapse>
        </Box>
      ))}
    </Box>
  );
};
