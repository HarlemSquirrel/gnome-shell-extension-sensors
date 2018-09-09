/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;

const ByteArray = imports.byteArray;

/**
 * initTranslations:
 * @domain: (optional): the gettext domain to use
 *
 * Initialize Gettext to load translations from extensionsdir/locale.
 * If @domain is not provided, it will be taken from metadata['gettext-domain']
 */
function initTranslations(domain) {
  let extension = ExtensionUtils.getCurrentExtension();

  domain = domain || extension.metadata['gettext-domain'];

  // check if this extension was built with "make zip-file", and thus
  // has the locale files in a subfolder
  // otherwise assume that extension has been installed in the
  // same prefix as gnome-shell
  let localeDir = extension.dir.get_child('locale');
  if (localeDir.query_exists(null))
    Gettext.bindtextdomain(domain, localeDir.get_path());
  else
    Gettext.bindtextdomain(domain, Config.LOCALEDIR);
}

/**
 * initIcons:
 *
 * Initialize Gtk to load icons from extensionsdir/icons.
 */
function initIcons() {
  let extension = ExtensionUtils.getCurrentExtension();

  let theme = Gtk.IconTheme.get_default();
  let iconDir = extension.dir.get_child('icons');
  if(iconDir.query_exists(null))
    theme.append_search_path(iconDir.get_path());
}

/**
 * getSettings:
 * @schema: (optional): the GSettings schema id
 *
 * Builds and return a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is not provided, it is taken from
 * metadata['settings-schema'].
 */
function getSettings(schema) {
  let extension = ExtensionUtils.getCurrentExtension();

  schema = schema || extension.metadata['settings-schema'];

  const GioSSS = Gio.SettingsSchemaSource;

  // check if this extension was built with "make zip-file", and thus
  // has the schema files in a subfolder
  // otherwise assume that extension has been installed in the
  // same prefix as gnome-shell (and therefore schemas are available
  // in the standard folders)
  let schemaDir = extension.dir.get_child('schemas');
  let schemaSource;
  if (schemaDir.query_exists(null))
    schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                         GioSSS.get_default(),
                         false);
  else
    schemaSource = GioSSS.get_default();

  let schemaObj = schemaSource.lookup(schema, true);
  if (!schemaObj)
    throw new Error('Schema ' + schema + ' could not be found for extension '
            + extension.metadata.uuid + '. Please check your installation.');

  return new Gio.Settings({ settings_schema: schemaObj });
}

/**
 * byteArrayToString:
 * @byte_array: the byte_array to decode a UTF-8 string from
 *
 * This is a compatibility wrapper. Since gjs 1.54 the custom ByteArray has
 * been removed and replaced by the standardized Uint8Array type.
 * The uint8_array.to_String() will not return the amused UTF-8 string in gjs
 * version > 1.54 but a string with the decimal digits of each byte joined with
 * commas.
 *
 * The recommended way to get a UTF-8 decoded string from a Uint8Array is to
 * use the static function ByteArray.toString(byte_array) which is available
 * with gjs 1.54.
 *
 * To remain compatible with gjs < 1.54 this helper function checks for the
 * instance type of the byte_array and calls the correct function to decode the
 * UTF-8 string.
 */
function byteArrayToString (byte_array) {
    if (byte_array instanceof ByteArray.ByteArray) {
        return byte_array.toString();
    } else if (byte_array instanceof Uint8Array) {
        return ByteArray.toString(byte_array);
    }
}
