import { useSettings } from "@/hooks/useSettings";
import "./generalSettings.scss";
import { toast } from "sonner";

const GeneralSettings = () => {
  const {settingsData, settingsAction} =useSettings();
  // const {setTheme, theme} = useSettings();
  const theme = settingsData.theme
  return (
    <div className="generalSettings">
      <h3>General</h3>

      <div className="themeSettings">
        <div className="d1">
          <p className="p1">Theme</p>
          <p className="p2">App follows system theme</p>
        </div>
        <div className="d2">
          <button
          className={`${theme === 'light' ? 'active': ''}`}
           onClick={()=>settingsAction.theme.preset.light()} >Light</button>
          <button
          className={`${theme === 'dark' ? 'active': ''}`}
          onClick={()=>settingsAction.theme.preset.dark()}>Dark</button>
          <button
          className={`${theme === 'blueGrey' ? 'active': ''}`}
          onClick={()=> settingsAction.theme.preset.blueGrey()}>BlueGrey</button>
          <button
          className={`${theme === 'system' ? 'active': ''}`}
          onClick={()=>settingsAction.theme.preset.system()}>System</button>
          <button
          className={`${theme === 'custom' ? 'active': ''}`}
          onClick={()=>settingsAction.theme.preset.custom()}>Custom</button>
        </div>
      </div>
 
      <div className="languageSettings">
        <div className="d1">
          <p className="p1">Language</p>
          <p className="p2">Current language is English</p>
        </div>
        <div className="d2">
          <button className="b1" onClick={()=>{
            toast.info(`'Will be available in Upcoming version's`)
          }}>Change</button>
        </div>
      </div>


      <div className="nsfwContentSettings">
        <div className="d1">
          <p className="p1">NSFW Content</p>
          <p className="p2">Display Not Safe For Work content</p>
        </div>
        <div className="d2">
          <label className="switch" id="l1">
            <input type="checkbox" className="i1" />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="notificationsSettings">
        <div className="d1">
          <p className="p1">Notifications</p>
          <p className="p2">Manage in-app and desktop notifications</p>
        </div>
        <div className="d2">
          <button className="b1">Change</button>
        </div>
      </div>
    </div>
  );
};
export default GeneralSettings;