import { Box, Typography, IconButton, Collapse, useMediaQuery, useTheme } from '@mui/material';
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

/* ─── Desktop (unchanged) ─────────────────────────────────── */

const DesktopDateTree = ({
  dateTree,
  selectedDate,
  expandedYears,
  expandedMonths,
  onSelectDate,
  onToggleYear,
  onToggleMonth,
}: Props) => {
  const isYearActive  = (y: number) => selectedDate.year === y && !selectedDate.month;
  const isMonthActive = (y: number, m: number) =>
    selectedDate.year === y && selectedDate.month === m && !selectedDate.day;
  const isDayActive   = (y: number, m: number, d: number) =>
    selectedDate.year === y && selectedDate.month === m && selectedDate.day === d;

  return (
    <Box>
      <Box
        sx={{ ...treeItemSx(!selectedDate.year), display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}
        onClick={() => onSelectDate()}
      >
        <CalendarTodayIcon sx={{ fontSize: 14 }} />
        <Typography variant="body2" fontWeight={600}>すべて</Typography>
      </Box>

      {dateTree.map(({ year, months }) => (
        <Box key={year}>
          <Box sx={{ display: 'flex', alignItems: 'center', ...treeItemSx(isYearActive(year)), mt: 0.5 }}>
            <IconButton size="small" onClick={() => onToggleYear(year)} sx={{ p: 0.3, mr: 0.3, color: 'text.secondary' }}>
              {expandedYears.has(year)
                ? <ExpandMoreIcon sx={{ fontSize: 16 }} />
                : <ChevronRightIcon sx={{ fontSize: 16 }} />}
            </IconButton>
            <Typography variant="body2" fontWeight={700} onClick={() => onSelectDate(year)} sx={{ cursor: 'pointer', flex: 1 }}>
              {year}年
            </Typography>
          </Box>

          <Collapse in={expandedYears.has(year)}>
            {months.map(({ month, days }) => (
              <Box key={month} sx={{ pl: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', ...treeItemSx(isMonthActive(year, month)), mt: 0.3 }}>
                  <IconButton size="small" onClick={() => onToggleMonth(year, month)} sx={{ p: 0.2, mr: 0.3, color: 'text.secondary' }}>
                    {expandedMonths.has(`${year}-${month}`)
                      ? <ExpandMoreIcon sx={{ fontSize: 14 }} />
                      : <ChevronRightIcon sx={{ fontSize: 14 }} />}
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
                      sx={{ pl: 3, ...treeItemSx(isDayActive(year, month, day)), mt: 0.2 }}
                      onClick={() => onSelectDate(year, month, day)}
                    >
                      <Typography variant="caption" sx={{ color: 'inherit' }}>{day}日</Typography>
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

/* ─── Mobile (redesigned) ─────────────────────────────────── */

const ACCENT   = '#a78bfa';
const ACCENT2  = '#c4b5fd';
const BG_YEAR  = alpha('#7c3aed', 0.22);
const BG_MONTH = alpha('#5b21b6', 0.2);
const BG_HOVER = alpha('#7c3aed', 0.14);

const rowBase = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  borderRadius: '12px',
  cursor: 'pointer',
  userSelect: 'none' as const,
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
  '&:active': { transform: 'scale(0.97)' },
};

const MobileDateTree = ({
  dateTree,
  selectedDate,
  expandedYears,
  expandedMonths,
  onSelectDate,
  onToggleYear,
  onToggleMonth,
}: Props) => {
  const isYearActive  = (y: number) => selectedDate.year === y && !selectedDate.month;
  const isMonthActive = (y: number, m: number) =>
    selectedDate.year === y && selectedDate.month === m && !selectedDate.day;
  const isDayActive   = (y: number, m: number, d: number) =>
    selectedDate.year === y && selectedDate.month === m && selectedDate.day === d;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>

      {/* ── すべて ── */}
      <Box
        onClick={() => onSelectDate()}
        sx={{
          ...rowBase,
          minHeight: 56,
          px: 2,
          gap: 1.5,
          background: !selectedDate.year
            ? `linear-gradient(135deg, ${alpha('#7c3aed', 0.35)}, ${alpha('#4c1d95', 0.2)})`
            : 'transparent',
          border: !selectedDate.year
            ? `1px solid ${alpha(ACCENT, 0.45)}`
            : '1px solid transparent',
          boxShadow: !selectedDate.year
            ? `0 0 16px ${alpha('#7c3aed', 0.25)}, inset 0 0 12px ${alpha('#a78bfa', 0.08)}`
            : 'none',
          '&:hover': { background: !selectedDate.year ? undefined : BG_HOVER },
        }}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: !selectedDate.year
              ? `linear-gradient(135deg, ${alpha('#a78bfa', 0.6)}, ${alpha('#7c3aed', 0.4)})`
              : alpha('#a78bfa', 0.15),
            flexShrink: 0,
            transition: 'background 0.2s ease',
          }}
        >
          <CalendarTodayIcon sx={{ fontSize: 16, color: !selectedDate.year ? '#fff' : ACCENT }} />
        </Box>
        <Typography
          variant="body1"
          fontWeight={!selectedDate.year ? 700 : 500}
          sx={{ color: !selectedDate.year ? '#e9d5ff' : 'text.secondary', letterSpacing: '0.02em' }}
        >
          すべての写真
        </Typography>
      </Box>

      {/* ── 区切り ── */}
      <Box sx={{ height: 1, mx: 1, background: alpha(ACCENT, 0.1), borderRadius: 1 }} />

      {/* ── 年ループ ── */}
      {dateTree.map(({ year, months }) => {
        const yearActive    = isYearActive(year);
        const yearExpanded  = expandedYears.has(year);

        return (
          <Box key={year}>
            {/* 年行 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {/* 年テキスト部（タップ→年選択） */}
              <Box
                onClick={() => onSelectDate(year)}
                sx={{
                  ...rowBase,
                  flex: 1,
                  minHeight: 52,
                  pl: 2,
                  pr: 1,
                  background: yearActive ? BG_YEAR : 'transparent',
                  borderLeft: yearActive
                    ? `3px solid ${ACCENT}`
                    : '3px solid transparent',
                  boxShadow: yearActive ? `inset 0 0 20px ${alpha('#7c3aed', 0.12)}` : 'none',
                  '&:hover': { background: yearActive ? BG_YEAR : BG_HOVER },
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight={yearActive ? 800 : 600}
                  sx={{
                    color: yearActive ? ACCENT2 : alpha('#e2d9fe', 0.75),
                    fontSize: '1.05rem',
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                  }}
                >
                  {year}
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.7rem', ml: 0.4, fontWeight: 400, color: alpha(ACCENT2, 0.6) }}
                  >
                    年
                  </Typography>
                </Typography>
              </Box>

              {/* 展開ボタン */}
              <IconButton
                onClick={(e) => { e.stopPropagation(); onToggleYear(year); }}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  color: yearExpanded ? ACCENT : alpha('#e2d9fe', 0.4),
                  background: yearExpanded ? alpha('#7c3aed', 0.18) : 'transparent',
                  transition: 'all 0.25s ease',
                  '&:hover': { background: alpha('#7c3aed', 0.2) },
                  flexShrink: 0,
                }}
              >
                <ExpandMoreIcon
                  sx={{
                    fontSize: 22,
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: yearExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  }}
                />
              </IconButton>
            </Box>

            {/* 月リスト */}
            <Collapse
              in={yearExpanded}
              timeout={{ enter: 320, exit: 220 }}
              easing={{ enter: 'cubic-bezier(0.34, 1.4, 0.64, 1)', exit: 'ease-in' }}
            >
              <Box sx={{ pl: 1.5, display: 'flex', flexDirection: 'column', gap: 0.4, pb: 0.5 }}>
                {months.map(({ month, days }) => {
                  const monthActive   = isMonthActive(year, month);
                  const monthExpanded = expandedMonths.has(`${year}-${month}`);

                  return (
                    <Box key={month}>
                      {/* 月行 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box
                          onClick={() => onSelectDate(year, month)}
                          sx={{
                            ...rowBase,
                            flex: 1,
                            minHeight: 46,
                            pl: 1.5,
                            pr: 1,
                            background: monthActive ? BG_MONTH : 'transparent',
                            borderLeft: monthActive
                              ? `2px solid ${alpha(ACCENT2, 0.7)}`
                              : '2px solid transparent',
                            '&:hover': { background: monthActive ? BG_MONTH : alpha('#5b21b6', 0.1) },
                          }}
                        >
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: monthActive
                                ? alpha('#7c3aed', 0.4)
                                : alpha('#5b21b6', 0.2),
                              mr: 1.2,
                              flexShrink: 0,
                              transition: 'background 0.2s ease',
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                color: monthActive ? '#e9d5ff' : alpha(ACCENT2, 0.7),
                                lineHeight: 1,
                              }}
                            >
                              {String(month).padStart(2, '0')}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body2"
                            fontWeight={monthActive ? 700 : 500}
                            sx={{
                              color: monthActive ? ACCENT2 : alpha('#c4b5fd', 0.65),
                              fontSize: '0.9rem',
                            }}
                          >
                            {month}月
                          </Typography>
                        </Box>

                        <IconButton
                          onClick={(e) => { e.stopPropagation(); onToggleMonth(year, month); }}
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            color: monthExpanded ? ACCENT : alpha(ACCENT2, 0.3),
                            background: monthExpanded ? alpha('#5b21b6', 0.25) : 'transparent',
                            transition: 'all 0.25s ease',
                            '&:hover': { background: alpha('#5b21b6', 0.2) },
                            flexShrink: 0,
                          }}
                        >
                          <ExpandMoreIcon
                            sx={{
                              fontSize: 18,
                              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              transform: monthExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            }}
                          />
                        </IconButton>
                      </Box>

                      {/* 日チップ（横スクロール） */}
                      <Collapse
                        in={monthExpanded}
                        timeout={{ enter: 280, exit: 180 }}
                        easing={{ enter: 'cubic-bezier(0.34, 1.4, 0.64, 1)', exit: 'ease-in' }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            overflowX: 'auto',
                            gap: 0.75,
                            px: 1.5,
                            py: 1,
                            ml: 1,
                            scrollbarWidth: 'none',
                            '&::-webkit-scrollbar': { display: 'none' },
                          }}
                        >
                          {days.map((day) => {
                            const dayActive = isDayActive(year, month, day);
                            return (
                              <Box
                                key={day}
                                onClick={() => onSelectDate(year, month, day)}
                                sx={{
                                  flexShrink: 0,
                                  width: 42,
                                  height: 42,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  WebkitTapHighlightColor: 'transparent',
                                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                  background: dayActive
                                    ? `linear-gradient(135deg, #7c3aed, #a78bfa)`
                                    : alpha('#3b0764', 0.35),
                                  border: dayActive
                                    ? 'none'
                                    : `1px solid ${alpha(ACCENT, 0.2)}`,
                                  boxShadow: dayActive
                                    ? `0 4px 14px ${alpha('#7c3aed', 0.55)}, 0 0 0 2px ${alpha(ACCENT, 0.3)}`
                                    : 'none',
                                  '&:hover': {
                                    background: dayActive
                                      ? `linear-gradient(135deg, #6d28d9, #8b5cf6)`
                                      : alpha('#5b21b6', 0.4),
                                    transform: 'scale(1.1)',
                                  },
                                  '&:active': { transform: 'scale(0.92)' },
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: '0.78rem',
                                    fontWeight: dayActive ? 800 : 500,
                                    color: dayActive ? '#fff' : alpha(ACCENT2, 0.75),
                                    lineHeight: 1,
                                  }}
                                >
                                  {day}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: '0.48rem',
                                    color: dayActive ? alpha('#fff', 0.75) : alpha(ACCENT2, 0.4),
                                    lineHeight: 1,
                                    mt: 0.2,
                                  }}
                                >
                                  日
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Collapse>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>

            {/* 年の区切り線 */}
            <Box sx={{ height: 1, mx: 1, mt: 0.5, background: alpha(ACCENT, 0.07), borderRadius: 1 }} />
          </Box>
        );
      })}
    </Box>
  );
};

/* ─── Entry point ─────────────────────────────────────────── */

export const DateTree = (props: Props) => {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  return isMobile ? <MobileDateTree {...props} /> : <DesktopDateTree {...props} />;
};
