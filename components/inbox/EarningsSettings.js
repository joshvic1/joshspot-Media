import {useState} from 'react';
import {FiChevronDown,FiTrendingDown} from 'react-icons/fi';
import Earnings from './Earnings';
import s from '../../styles/Inbox.module.css';

export default function EarningsSettings({onOpenResponse}) {
  const [expanded,setExpanded]=useState(false);
  return <section className={s.earningsSettings}>
    <button type="button" className={s.earningsSettingsToggle} aria-expanded={expanded} aria-controls="staff-earnings-content" onClick={()=>setExpanded(value=>!value)}>
      <span><FiTrendingDown/>Earnings</span>
      <FiChevronDown style={{transform:expanded?'rotate(180deg)':undefined}}/>
    </button>
    <div id="staff-earnings-content" hidden={!expanded}>
      {expanded&&<Earnings compact onOpenResponse={onOpenResponse}/>}
    </div>
  </section>;
}
